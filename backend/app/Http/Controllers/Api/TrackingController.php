<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Parcel;
use App\Models\ParcelStatusHistory;
use App\Models\RiderLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer tracking endpoints (PRD 2.5, FR-MAP-001..004).
 * Low-bandwidth Leaflet + OSM tracking with 3-marker overlay and ETA buffer.
 */
class TrackingController extends Controller
{
    /**
     * GET /api/track/{tracking} — public tracking page data.
     *
     * Returns: parcel info, status timeline, origin hub coords, rider location,
     * destination, ETA range (with 1.30x buffer, FR-MAP-004).
     */
    public function show(string $tracking): JsonResponse
    {
        $parcel = Parcel::with(['hub:id,name,address,latitude,longitude,barangay'])
            ->where('tracking_number', $tracking)
            ->firstOrFail();

        $statusHistory = ParcelStatusHistory::where('parcel_id', $parcel->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        // Latest rider position (FR-MAP-003)
        $riderLocation = null;
        if ($parcel->rider_id) {
            $riderLocation = RiderLocation::where('rider_id', $parcel->rider_id)
                ->latest('recorded_at')
                ->first();
        }

        // ETA ("last seen" badge if telemetry > 15 minutes stale)
        $lastSeenMinutes = null;
        if ($riderLocation) {
            $lastSeenMinutes = $riderLocation->recorded_at->diffInMinutes(now());
            $riderLocation->is_stale = $lastSeenMinutes > 15;
            $riderLocation->last_seen_label = $riderLocation->is_stale
                ? "Last seen {$lastSeenMinutes} mins ago"
                : null;
        }

        // ETA range (FR-MAP-004)
        $eta = null;
        if ($parcel->delivery_distance_km > 0) {
            $avgSpeedKmph = 25; // provincial average
            $rawMinutes = ($parcel->delivery_distance_km / $avgSpeedKmph) * 60;
            $multiplier = (float) config('bayanbox.eta.buffer_multiplier', 1.30);
            $spread = (int) config('bayanbox.eta.range_spread_minutes', 7);
            $buffered = $rawMinutes * $multiplier;
            $eta = [
                'min' => max(1, (int) round($buffered - $spread / 2)),
                'max' => (int) round($buffered + $spread / 2),
            ];
        }

        return response()->json([
            'parcel' => $parcel->only([
                'id', 'tracking_number', 'status', 'recipient_name', 'shipper_name',
                'cod_amount', 'delivery_distance_km', 'calculated_delivery_fee',
                'arrived_at_hub_at', 'picked_up_at', 'delivered_at',
                'destination_address', 'destination_latitude', 'destination_longitude',
            ]),
            'origin_hub' => $parcel->hub?->only(['id', 'name', 'address', 'latitude', 'longitude']),
            'destination' => [
                'address' => $parcel->destination_address,
                'latitude' => $parcel->destination_latitude,
                'longitude' => $parcel->destination_longitude,
            ],
            'rider' => $riderLocation ? [
                'latitude' => $riderLocation->latitude,
                'longitude' => $riderLocation->longitude,
                'is_stale' => $riderLocation->is_stale ?? false,
                'last_seen_label' => $riderLocation->last_seen_label ?? null,
                'last_seen_at' => $riderLocation->recorded_at,
            ] : null,
            'status_history' => $statusHistory,
            'eta' => $eta,
        ]);
    }
}
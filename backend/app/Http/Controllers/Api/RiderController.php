<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryBatch;
use App\Models\Parcel;
use App\Models\RiderLocation;
use App\Models\Wallet;
use App\Services\ParcelService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Rider PWA endpoints — telemetry, batch routes, COD wallet management
 * (PRD 2.3, FR-MAP-002).
 */
class RiderController extends Controller
{
    public function __construct(
        protected ParcelService $parcelService,
        protected WalletService $walletService,
    ) {}

    /**
     * POST /api/rider/telemetry — push GPS coordinates (50m threshold).
     * Accepts a single fix or a batch array.
     */
    public function telemetry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required_without:points|numeric|between:-90,90',
            'longitude' => 'required_without:points|numeric|between:-180,180',
            'accuracy_m' => 'nullable|numeric|min:0',
            'speed_mps' => 'nullable|numeric|min:0',
            'heading_deg' => 'nullable|numeric|between:0,360',
            'recorded_at' => 'nullable|date',
            'points' => 'nullable|array',
            'points.*.latitude' => 'required|numeric|between:-90,90',
            'points.*.longitude' => 'required|numeric|between:-180,180',
            'points.*.accuracy_m' => 'nullable|numeric|min:0',
            'points.*.speed_mps' => 'nullable|numeric|min:0',
            'points.*.heading_deg' => 'nullable|numeric|between:0,360',
            'points.*.recorded_at' => 'nullable|date',
        ]);

        $rider = $request->user();

        // Batch insert
        $points = $validated['points'] ?? [$validated];
        $now = now();

        $records = collect($points)->map(fn ($p) => [
            'rider_id' => $rider->id,
            'latitude' => $p['latitude'],
            'longitude' => $p['longitude'],
            'accuracy_m' => $p['accuracy_m'] ?? 0,
            'speed_mps' => $p['speed_mps'] ?? null,
            'heading_deg' => $p['heading_deg'] ?? null,
            'recorded_at' => $p['recorded_at'] ?? $now,
        ])->toArray();

        RiderLocation::insert($records);

        return response()->json([
            'message' => 'Telemetry recorded.',
            'count' => count($records),
        ]);
    }

    /**
     * GET /api/rider/batches — assigned delivery batches.
     */
    public function batches(Request $request): JsonResponse
    {
        $rider = $request->user();

        $batches = DeliveryBatch::with(['hub:id,name,address', 'batchParcels.parcel:id,tracking_number,recipient_name,recipient_phone,status,destination_address,cod_amount,calculated_delivery_fee'])
            ->where('rider_id', $rider->id)
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($batches);
    }

    /**
     * POST /api/rider/batches/{batch}/parcels/{parcelId}/deliver
     */
    public function markDelivered(string $batchCode, int $parcelId, Request $request): JsonResponse
    {
        $batch = DeliveryBatch::where('batch_code', $batchCode)->firstOrFail();
        $parcel = Parcel::findOrFail($parcelId);

        $validated = $request->validate([
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'proof_photo' => 'nullable|string', // base64 or URL
        ]);

        $parcel = $this->parcelService->markDelivered($parcel, $request->user(), $validated);

        // update pivot
        $batch->batchParcels()->where('parcel_id', $parcel->id)->update([
            'dropoff_status' => 'delivered',
            'proof_photo_path' => $validated['proof_photo'] ?? null,
        ]);

        return response()->json([
            'message' => 'Marked as delivered.',
            'parcel' => $parcel->load('rider'),
        ]);
    }

    /**
     * GET /api/rider/wallet — prepaid wallet balance + ledger, plus the
     * parcel delivery earnings (provider_earnings) wallet so riders see all
     * of their income sources in one place.
     */
    public function wallet(Request $request): JsonResponse
    {
        $rider = $request->user();

        $wallet = $this->walletService->ensureWallet($rider->id, 'rider_prepaid');
        $wallet->load('ledgerTransactions');

        $parcelEarnings = $this->walletService->ensureWallet($rider->id, Wallet::TYPE_PROVIDER_EARNINGS);
        $parcelEarnings->load('ledgerTransactions');

        return response()->json([
            'wallet' => $wallet,
            'balance' => $wallet->balance,
            'recent_transactions' => $wallet->ledgerTransactions()->latest()->limit(50)->get(),
            'parcel_wallet' => [
                'balance' => (float) $parcelEarnings->balance,
                'ledger' => $parcelEarnings->ledgerTransactions()->latest()->limit(50)->get(),
            ],
        ]);
    }

    /**
     * POST /api/rider/emergency — report an emergency (item 11).
     */
    public function emergency(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'nullable|string|max:500',
            'type' => 'nullable|in:accident,breakdown,weather,customer_unreachable,other',
            'order_id' => 'nullable|integer|exists:orders,id',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $rider = $request->user();

        // Persist as an incident report for the staff dashboard
        $incident = \App\Models\IncidentReport::create([
            'rider_id' => $rider->id,
            'order_id' => $validated['order_id'] ?? null,
            'type' => $validated['type'] ?? 'other',
            'description' => $validated['message'] ?? "Rider {$rider->name} reported an emergency.",
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'status' => 'open',
        ]);

        app(\App\Services\NotificationService::class)->riderEmergency(
            $rider->id,
            $validated['message'] ?? "Rider {$rider->name} reported an emergency.",
        );

        return response()->json(['message' => 'Emergency reported to staff.', 'incident_id' => $incident->id], 201);
    }
}
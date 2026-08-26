<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hub;
use App\Models\Parcel;
use App\Services\ParcelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff Hub PWA endpoints — inbound intake, inventory reconciliation,
 * OTP release, reverse hand-off (PRD 2.2, FR-OFF-001/002/003).
 */
class HubController extends Controller
{
    public function __construct(
        protected ParcelService $parcelService,
    ) {}

    /**
     * GET /api/hub/inventory — current hub parcel list (reconciliation).
     */
    public function inventory(Request $request): JsonResponse
    {
        $hub = $this->resolveStaffHub($request->user());

        $parcels = Parcel::with(['rider:id,name,phone'])
            ->where('hub_id', $hub->id)
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('search'), function ($q, $s) {
                $q->where(fn ($w) => $w
                    ->where('tracking_number', 'ilike', "%{$s}%")
                    ->orWhere('recipient_name', 'ilike', "%{$s}%")
                    ->orWhere('recipient_phone', 'ilike', "%{$s}%"));
            })
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'hub' => $hub,
            'parcels' => $parcels,
            'current_parcel_count' => $hub->current_parcel_count,
            'capacity_limit' => $hub->capacity_limit,
        ]);
    }

    /**
     * POST /api/hub/intake — scan barcode to register inbound parcel.
     */
    public function intake(Request $request): JsonResponse
    {
        $hub = $this->resolveStaffHub($request->user());

        $validated = $request->validate([
            'tracking_number' => 'required|string|max:100|unique:parcels,tracking_number',
            'recipient_name' => 'required|string|max:100',
            'recipient_phone' => 'required|string|max:20',
            'shipper_name' => 'nullable|string|max:100',
            'cod_amount' => 'nullable|numeric|min:0',
            'destination_address' => 'nullable|string|max:255',
            'destination_latitude' => 'nullable|numeric|between:-90,90',
            'destination_longitude' => 'nullable|numeric|between:-180,180',
            'destination_barangay' => 'nullable|string|max:100',
            'referred_by_id' => 'nullable|exists:users,id',
        ]);

        $parcel = $this->parcelService->intake($hub, $validated);

        return response()->json([
            'message' => 'Parcel intake registered.',
            'parcel' => $parcel->load('hub:id,name,address'),
        ], 201);
    }

    /**
     * POST /api/hub/parcels/{tracking}/reconcile — confirm receipt, SMS OTP.
     */
    public function reconcile(string $tracking): JsonResponse
    {
        $parcel = $this->findParcel($tracking);

        $parcel->forceFill([
            'status' => 'received_at_hub',
            'arrived_at_hub_at' => $parcel->arrived_at_hub_at ?? now(),
        ])->save();

        $this->parcelService->logStatus($parcel, 'received_at_hub', 'Receipt confirmed by hub staff.');

        return response()->json([
            'message' => 'Receipt confirmed. OTP SMS dispatched.',
            'parcel' => $parcel->refresh(),
        ]);
    }

    /**
     * POST /api/hub/parcels/{tracking}/release — validate OTP, hand over.
     */
    public function release(string $tracking, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'otp_code' => 'required|string|size:6',
        ]);

        $parcel = $this->findParcel($tracking);
        $parcel = $this->parcelService->releaseByOtp($parcel, $validated['otp_code'], $request->user());

        return response()->json([
            'message' => 'Parcel released to customer.',
            'parcel' => $parcel->refresh()->load('hub:id,name'),
        ]);
    }

    /**
     * POST /api/hub/parcels/{tracking}/return — reverse hand-off.
     */
    public function markReturned(string $tracking, Request $request): JsonResponse
    {
        $parcel = $this->findParcel($tracking);
        $parcel = $this->parcelService->markReturned($parcel, $request->input('note', 'Returned to hub'), $request->user());

        return response()->json([
            'message' => 'Parcel marked as returned.',
            'parcel' => $parcel,
        ]);
    }

    protected function resolveStaffHub($user): Hub
    {
        $hub = $user->hub;

        if (! $hub) {
            abort(403, 'No hub is bound to your staff account.');
        }

        return $hub;
    }

    protected function findParcel(string $tracking): Parcel
    {
        return Parcel::where('tracking_number', $tracking)->firstOrFail();
    }
}
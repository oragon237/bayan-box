<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PackagingItem;
use App\Models\PackagingRedemption;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Suki Points engine endpoints (FR-LOY-001..004).
 */
class LoyaltyController extends Controller
{
    public function __construct(
        protected LoyaltyService $loyalty,
    ) {}

    /**
     * GET /api/loyalty — balance + ledger list (FR-LOY-001).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'balance' => $this->loyalty->balance($user),
            'ledger' => $this->loyalty->ledger($user, $request->integer('limit', 50)),
        ]);
    }

    /**
     * GET /api/loyalty/packaging — marketplace catalog (FR-LOY-003).
     */
    public function packagingCatalog(): JsonResponse
    {
        return response()->json([
            'items' => PackagingItem::where('is_active', true)->get(),
        ]);
    }

    /**
     * POST /api/loyalty/packaging/redeem — burn points for packaging supplies.
     */
    public function redeemPackaging(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'packaging_item_id' => 'required|exists:packaging_items,id',
            'quantity' => 'required|integer|min:1|max:100',
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($validated, $user) {
            $item = PackagingItem::where('id', $validated['packaging_item_id'])
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (! $item) {
                throw new RuntimeException('Packaging item unavailable.');
            }

            $qty = (int) $validated['quantity'];
            $pointsSpent = $item->points_price * $qty;

            if ($pointsSpent <= 0) {
                throw new RuntimeException('Item is not redeemable with points.');
            }

            if ($item->stock_qty < $qty) {
                throw new RuntimeException('Insufficient stock.');
            }

            // Burn points atomically
            $this->loyalty->burn(
                $user,
                $pointsSpent,
                'packaging_redemption',
                "{$qty}x {$item->name}",
                $item,
            );

            $item->decrement('stock_qty', $qty);

            $redemption = PackagingRedemption::create([
                'user_id' => $user->id,
                'packaging_item_id' => $item->id,
                'quantity' => $qty,
                'points_spent' => $pointsSpent,
            ]);

            return response()->json([
                'message' => 'Redemption placed.',
                'redemption' => $redemption->load('packagingItem'),
                'remaining_balance' => $this->loyalty->balance($user),
            ]);
        });
    }

    /**
     * POST /api/loyalty/doorstep-upgrade — burn 50 points for a 3km doorstep
     * delivery upgrade (FR-LOY-004).
     */
    public function doorstepUpgrade(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'parcel_id' => 'required|exists:parcels,id',
        ]);

        $user = $request->user();
        $parcel = \App\Models\Parcel::findOrFail($validated['parcel_id']);

        $pointsCost = (int) config('bayanbox.loyalty.doorstep_upgrade_points', 50);
        $radiusKm = (float) config('bayanbox.loyalty.doorstep_upgrade_radius_km', 3);

        // Doorstep delivery only makes sense for hub-side parcels
        if (! in_array($parcel->status, ['received_at_hub', 'picked_up'], true)) {
            throw new RuntimeException('Doorstep upgrade is only available before pickup.');
        }

        $this->loyalty->burn(
            $user,
            $pointsCost,
            'doorstep_upgrade',
            "Doorstep delivery upgrade — {$parcel->tracking_number} (≤{$radiusKm}km)",
            $parcel,
        );

        return response()->json([
            'message' => 'Doorstep upgrade applied.',
            'points_remaining' => $this->loyalty->balance($user),
        ]);
    }
}
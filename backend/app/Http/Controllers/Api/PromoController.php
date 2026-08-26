<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Parcel;
use App\Models\PromoCode;
use App\Services\PromoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Promo code management (FR-PROMO-001..003).
 */
class PromoController extends Controller
{
    public function __construct(
        protected PromoService $promoService,
    ) {}

    /**
     * GET /api/promos — list active promos (admin).
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            PromoCode::with('hub:id,name')
                ->when($request->input('active'), fn ($q) => $q->where('is_active', true))
                ->orderByDesc('created_at')
                ->paginate($request->integer('per_page', 30))
        );
    }

    /**
     * POST /api/promos — create a geo-targeted promo (admin).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:40|unique:promo_codes,code',
            'description' => 'nullable|string|max:255',
            'discount_type' => 'required|in:flat,percent,free_delivery',
            'discount_value' => 'required|numeric|min:0',
            'min_transaction_amount' => 'nullable|numeric|min:0',
            'hub_id' => 'nullable|exists:hubs,id',
            'barangay' => 'nullable|string|max:100',
            'municipality' => 'nullable|string|max:100',
            'min_parcels_per_transaction' => 'nullable|integer|min:1',
            'max_uses' => 'nullable|integer|min:0',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:starts_at',
        ]);

        $promo = PromoCode::create(array_merge($validated, [
            'created_by' => $request->user()->id,
            'used_count' => 0,
            'is_active' => true,
        ]));

        return response()->json($promo, 201);
    }

    /**
     * POST /api/promos/apply — validate + apply a code to a parcel pickup.
     */
    public function apply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:40',
            'parcel_id' => 'required|exists:parcels,id',
            'transaction_amount' => 'required|numeric|min:0',
            'parcel_count' => 'nullable|integer|min:1',
        ]);

        $parcel = Parcel::findOrFail($validated['parcel_id']);

        try {
            $result = $this->promoService->apply(
                $validated['code'],
                $request->user(),
                $parcel,
                (float) $validated['transaction_amount'],
                ['parcel_count' => $validated['parcel_count'] ?? 1],
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json($result);
    }

    /**
     * POST /api/promos/{id}/toggle — enable/disable (admin).
     */
    public function toggle(int $id): JsonResponse
    {
        $promo = PromoCode::findOrFail($id);
        $promo->is_active = ! $promo->is_active;
        $promo->save();

        return response()->json($promo);
    }
}
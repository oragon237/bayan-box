<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MarketplaceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * E-commerce checkout (FR-MKT-005..007).
 */
class CheckoutController extends Controller
{
    public function __construct(
        protected MarketplaceService $marketplace,
    ) {}

    /**
     * POST /api/checkout — process the cart with fulfillment + ledger splits.
     */
    public function processPurchase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fulfillment_type' => 'required|in:pickup,delivery',
            'hub_id' => 'required_if:fulfillment_type,pickup|nullable|exists:hubs,id',
            'delivery_address' => 'required_if:fulfillment_type,delivery|nullable|string',
            'latitude' => 'required_if:fulfillment_type,delivery|nullable|numeric',
            'longitude' => 'required_if:fulfillment_type,delivery|nullable|numeric',
            'municipality' => 'nullable|string|max:100',
            'referral_code' => 'nullable|string|max:15',
        ]);

        $order = $this->marketplace->processCheckout($request->user(), $validated);

        return response()->json([
            'status' => 'purchase_completed',
            'order' => $order,
        ]);
    }
}
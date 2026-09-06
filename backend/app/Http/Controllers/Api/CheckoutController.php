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
            'payment_method' => 'sometimes|in:gcash,maya,cod',
            'hub_id' => 'required_if:fulfillment_type,pickup|nullable|exists:hubs,id',
            'delivery_address' => 'required_if:fulfillment_type,delivery|nullable|string',
            'latitude' => ['required_if:fulfillment_type,delivery', 'nullable', 'numeric', 'between:-14,21'],
            'longitude' => ['required_if:fulfillment_type,delivery', 'nullable', 'numeric', 'between:116,127'],
            'municipality' => 'nullable|string|max:100',
            'referral_code' => 'nullable|string|max:15',
            'use_affiliate_balance' => 'nullable|boolean',
        ]);

        $validated['payment_method'] = $validated['payment_method'] ?? 'gcash';

        try {
            $order = $this->marketplace->processCheckout($request->user(), $validated);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }

        // Measurement must never turn a successfully committed order into a checkout error.
        try {
            $context = \Illuminate\Support\Facades\Validator::make(
                (array) $request->input('conversion', []), ConversionController::contextRules()
            );
            if (! $context->fails()) {
                \Illuminate\Support\Facades\DB::table('conversion_events')->insertOrIgnore([
                    ...$context->validated(), 'event_id' => (string) \Illuminate\Support\Str::uuid(),
                    'event' => 'order_placed', 'order_id' => $order->id, 'created_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Order conversion recording failed', ['order_id' => $order->id]);
        }

        return response()->json([
            'status' => 'purchase_completed',
            'order' => $order,
        ]);
    }
}

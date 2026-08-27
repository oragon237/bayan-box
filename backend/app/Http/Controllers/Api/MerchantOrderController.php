<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Merchant order fulfillment workflow (accepted → packaging → sending to
 * courier → accepted by courier) + customer order tracking.
 */
class MerchantOrderController extends Controller
{
    protected const FULFILL_SEQUENCE = [
        Order::FULFILL_PENDING,
        Order::FULFILL_ACCEPTED,
        Order::FULFILL_PACKAGING,
        Order::FULFILL_SENDING,
        Order::FULFILL_COURIER_ACCEPTED,
    ];

    /**
     * GET /api/merchant/orders — orders containing this merchant's products.
     */
    public function index(Request $request): JsonResponse
    {
        $merchantId = $request->user()->id;

        $orders = Order::with(['customer:id,name,phone', 'items.product:id,name,merchant_id'])
            ->whereHas('items', fn ($q) => $q->whereHas('product', fn ($p) => $p->where('merchant_id', $merchantId)))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($orders);
    }

    /**
     * GET /api/orders — the authenticated customer's marketplace orders.
     */
    public function customerOrders(Request $request): JsonResponse
    {
        $orders = Order::with(['items.product:id,name,image_url', 'hub:id,name'])
            ->where('customer_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($orders);
    }

    /**
     * POST /api/merchant/orders/{id}/status — advance the fulfillment status.
     */
    public function updateStatus(int $id, Request $request): JsonResponse
    {
        $order = Order::whereHas('items', fn ($q) => $q->whereHas('product', fn ($p) => $p->where('merchant_id', $request->user()->id)))
            ->findOrFail($id);

        $validated = $request->validate([
            'fulfillment_status' => 'required|in:accepted,packaging,sending_to_courier,accepted_by_courier',
        ]);

        // Enforce forward-only progression
        $currentIdx = array_search($order->fulfillment_status, self::FULFILL_SEQUENCE, true) ?? 0;
        $nextIdx = array_search($validated['fulfillment_status'], self::FULFILL_SEQUENCE, true);

        if ($nextIdx < $currentIdx) {
            return response()->json(['message' => 'Cannot move backward in the fulfillment flow.'], 422);
        }

        $order->update(['fulfillment_status' => $validated['fulfillment_status']]);

        // Item 11: notify the customer of the fulfillment update
        app(\App\Services\NotificationService::class)->customerOrder(
            $order->customer_id,
            "Order #{$order->id} — ".str_replace('_', ' ', $validated['fulfillment_status']),
            'Your order fulfillment status has been updated.',
            ['order_id' => $order->id, 'fulfillment_status' => $validated['fulfillment_status']],
        );

        return response()->json([
            'message' => "Order marked as {$validated['fulfillment_status']}.",
            'order' => $order->fresh(),
        ]);
    }
}
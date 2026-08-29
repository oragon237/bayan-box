<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\DeliveryAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Rider doorstep-delivery management (item 3).
 *
 * Riders view the delivery orders assigned to them, refuse assignments
 * (which auto-reassigns round-robin), and mark deliveries as out-for-delivery
 * or completed.
 */
class RiderDeliveryController extends Controller
{
    public function __construct(
        protected DeliveryAssignmentService $assignments,
    ) {}

    /**
     * GET /api/rider/deliveries — assigned delivery orders.
     */
    public function index(Request $request): JsonResponse
    {
        $deliveries = Order::with(['customer:id,name,phone', 'hub:id,name', 'items.product:id,name'])
            ->where('rider_id', $request->user()->id)
            ->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
            ->whereIn('status', [DeliveryAssignmentService::STATUS_ASSIGNED, DeliveryAssignmentService::STATUS_OUT_FOR_DELIVERY])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['deliveries' => $deliveries]);
    }

    /**
     * GET /api/rider/deliveries/history — completed/refused/cancelled deliveries.
     */
    public function history(Request $request): JsonResponse
    {
        $history = Order::with(['customer:id,name,phone', 'items.product:id,name'])
            ->where('rider_id', $request->user()->id)
            ->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
            ->whereIn('status', [DeliveryAssignmentService::STATUS_DELIVERED, 'cancelled', 'disputed'])
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($history);
    }

    /**
     * POST /api/rider/deliveries/{id}/refuse — refuse, reassign round-robin.
     */
    public function refuse(int $id, Request $request): JsonResponse
    {
        $order = Order::where('id', $id)
            ->where('rider_id', $request->user()->id)
            ->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
            ->firstOrFail();

        $next = $this->assignments->refuse($order);

        return response()->json([
            'message' => 'Delivery refused. '.($next ? 'Reassigned to another rider.' : 'Returned to the unassigned pool (no active riders).'),
            'reassigned_to' => $next?->only(['id', 'name']),
        ]);
    }

    /**
     * POST /api/rider/deliveries/{id}/out-for-delivery
     */
    public function outForDelivery(int $id, Request $request): JsonResponse
    {
        $order = Order::where('id', $id)
            ->where('rider_id', $request->user()->id)
            ->firstOrFail();

        $this->assignments->markOutForDelivery($order);

        return response()->json(['message' => 'Marked as out for delivery.', 'order' => $order]);
    }

    /**
     * POST /api/rider/deliveries/{id}/deliver — mark completed.
     */
    public function deliver(int $id, Request $request): JsonResponse
    {
        $order = Order::where('id', $id)
            ->where('rider_id', $request->user()->id)
            ->firstOrFail();

        $this->assignments->markDelivered($order);

        // Fix #1: COD cash is collected at delivery — release deferred payouts
        if ($order->payment_method === 'cod') {
            app(\App\Services\MarketplaceService::class)->releaseOrderPayouts($order->fresh());
        }

        return response()->json(['message' => 'Delivery completed.', 'order' => $order->fresh()]);
    }
}
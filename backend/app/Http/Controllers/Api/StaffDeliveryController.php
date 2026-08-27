<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\DeliveryAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff delivery dispatch (item 4).
 *
 * Staff see unassigned doorstep-delivery orders, assign them round-robin to
 * riders, and view today's total sales.
 */
class StaffDeliveryController extends Controller
{
    public function __construct(
        protected DeliveryAssignmentService $assignments,
    ) {}

    /**
     * GET /api/staff/deliveries/unassigned — dispatch queue.
     */
    public function unassigned(Request $request): JsonResponse
    {
        $deliveries = $this->assignments->unassignedDeliveries()
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($deliveries);
    }

    /**
     * POST /api/staff/deliveries/{id}/assign — auto round-robin assignment.
     */
    public function assign(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $rider = $this->assignments->assign($order);

        if (! $rider) {
            return response()->json([
                'message' => 'No active riders available. Order queued for later assignment.',
                'order' => $order->fresh(),
            ], 202);
        }

        return response()->json([
            'message' => "Assigned to {$rider->name}.",
            'rider' => $rider->only(['id', 'name', 'phone']),
            'order' => $order->fresh(),
        ]);
    }

    /**
     * GET /api/staff/sales/today — total sales for today.
     */
    public function todaySales(): JsonResponse
    {
        $dayStart = today()->startOfDay();
        $dayEnd = today()->endOfDay();

        $orders = Order::whereBetween('created_at', [$dayStart, $dayEnd])
            ->whereIn('status', ['paid', 'assigned', 'out_for_delivery', 'delivered', 'completed', 'pending_payment'])
            ->get();

        return response()->json([
            'date' => today()->toDateString(),
            'order_count' => $orders->count(),
            'gross_sales' => round($orders->sum(fn ($o) => (float) $o->total_amount), 2),
            'delivery_fees' => round($orders->sum(fn ($o) => (float) $o->shipping_amount), 2),
            'total_revenue' => round($orders->sum(fn ($o) => (float) $o->total_amount + (float) $o->shipping_amount), 2),
        ]);
    }
}
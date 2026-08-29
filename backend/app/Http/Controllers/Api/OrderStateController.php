<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Order lifecycle state machine endpoints (per-role transitions).
 */
class OrderStateController extends Controller
{
    public function __construct(
        protected OrderStateMachine $machine,
    ) {}

    /**
     * GET /api/orders/{id}/state — current lifecycle state + allowed actions.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $order = Order::with(['customer:id,name,phone', 'rider:id,name,phone', 'hub:id,name'])->findOrFail($id);

        return response()->json([
            'order' => $order,
            'delivery_state' => $order->delivery_state,
            'allowed_actions' => $this->allowedActions($order, $request->user()->role),
        ]);
    }

    /**
     * POST /api/orders/{id}/state/{action} — perform a state transition.
     */
    public function transition(int $id, string $action, Request $request): JsonResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
            'to' => 'nullable|in:'.implode(',', $this->allStates()),
            'pin' => 'nullable|string|max:8',
            'photo_url' => 'nullable|string|max:255',
        ]);

        $order = $this->machine->transition($order, $action, $request->user(), $validated);

        return response()->json([
            'message' => "Order #{$order->id} moved to {$order->delivery_state}.",
            'delivery_state' => $order->delivery_state,
            'order' => $order,
        ]);
    }

    /**
     * POST /api/orders/{id}/generate-pin — generate a one-time delivery PIN.
     */
    public function generatePin(int $id, Request $request): JsonResponse
    {
        $order = Order::findOrFail($id);

        if (! in_array($request->user()->role, ['staff', 'admin', 'rider'], true)) {
            abort(403, 'Only staff, admin, or the assigned rider can generate a delivery PIN.');
        }

        $pin = $this->machine->generatePin($order);

        return response()->json(['pin' => $pin, 'message' => "Delivery PIN: {$pin}. Share this with the customer."]);
    }

    protected function allowedActions(Order $order, string $role): array
    {
        $state = $order->delivery_state;
        $actions = [];

        if ($role === 'customer' && $state === Order::STATE_PENDING_MERCHANT) {
            $actions[] = 'cancel';
        }
        if (in_array($role, ['merchant', 'admin'], true)) {
            if ($state === Order::STATE_PENDING_MERCHANT) { $actions[] = 'accept'; $actions[] = 'reject'; }
            if ($state === Order::STATE_PREPARING) { $actions[] = 'mark_ready'; }
        }
        if (in_array($role, ['staff', 'admin'], true)) {
            if (in_array($state, [Order::STATE_READY_FOR_PICKUP], true)) { $actions[] = 'assign_raider'; }
            $actions[] = 'force_cancel';
        }
        if ($role === 'rider') {
            if ($state === Order::STATE_READY_FOR_PICKUP) { $actions[] = 'accept_job'; }
            if ($state === Order::STATE_RAIDER_ASSIGNED) { $actions[] = 'depart_to_merchant'; }
            if ($state === Order::STATE_RAIDER_EN_ROUTE) { $actions[] = 'arrive_merchant'; }
            if ($state === Order::STATE_AT_MERCHANT) { $actions[] = 'pickup_order'; }
            if ($state === Order::STATE_IN_TRANSIT) { $actions[] = 'arrive_customer'; }
            if ($state === Order::STATE_ARRIVED) { $actions[] = 'complete_delivery'; }
        }

        return $actions;
    }

    protected function allStates(): array
    {
        return [
            Order::STATE_PENDING_MERCHANT, Order::STATE_PREPARING, Order::STATE_READY_FOR_PICKUP,
            Order::STATE_RAIDER_ASSIGNED, Order::STATE_RAIDER_EN_ROUTE, Order::STATE_AT_MERCHANT,
            Order::STATE_IN_TRANSIT, Order::STATE_ARRIVED, Order::STATE_DELIVERED, Order::STATE_CANCELLED,
        ];
    }
}
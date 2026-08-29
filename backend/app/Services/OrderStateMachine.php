<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Multi-party order lifecycle state machine.
 *
 * Defines allowed states, who may perform each transition, and the actions
 * that run on every move (timestamps, status mirroring, notifications).
 */
class OrderStateMachine
{
    // Allowed transition graph: current state => list of target states
    protected const TRANSITIONS = [
        Order::STATE_PENDING_MERCHANT => [
            Order::STATE_PREPARING,   // merchant accepts
            Order::STATE_CANCELLED,   // merchant rejects / customer cancels / auto-cancel
        ],
        Order::STATE_PREPARING => [
            Order::STATE_READY_FOR_PICKUP,
            Order::STATE_CANCELLED,
        ],
        Order::STATE_READY_FOR_PICKUP => [
            Order::STATE_RAIDER_ASSIGNED, // staff assigns / raider accepts
            Order::STATE_CANCELLED,
        ],
        Order::STATE_RAIDER_ASSIGNED => [
            Order::STATE_RAIDER_EN_ROUTE, // raider departs toward merchant
            Order::STATE_READY_FOR_PICKUP, // raider reassignment returns to pool
        ],
        Order::STATE_RAIDER_EN_ROUTE => [
            Order::STATE_AT_MERCHANT,
        ],
        Order::STATE_AT_MERCHANT => [
            Order::STATE_IN_TRANSIT, // raider picked up the parcel
        ],
        Order::STATE_IN_TRANSIT => [
            Order::STATE_ARRIVED,
        ],
        Order::STATE_ARRIVED => [
            Order::STATE_DELIVERED, // requires proof of delivery
        ],
        Order::STATE_DELIVERED => [],
        Order::STATE_CANCELLED => [],
    ];

    // Who can perform each action
    protected const ACTIONS = [
        'accept' => ['merchant', 'admin'],
        'reject' => ['merchant', 'admin'],
        'mark_ready' => ['merchant', 'admin'],
        'assign_raider' => ['staff', 'admin'],
        'accept_job' => ['rider'],
        'depart_to_merchant' => ['rider'],
        'arrive_merchant' => ['rider'],
        'pickup_order' => ['rider'],
        'arrive_customer' => ['rider'],
        'complete_delivery' => ['rider'],
        'cancel' => ['customer', 'staff', 'admin'], // customer only from PENDING_MERCHANT
        'force_cancel' => ['staff', 'admin'],
        'override' => ['staff', 'admin'],
    ];

    /**
     * Verify a transition is permitted for the actor's role, then apply it.
     */
    public function transition(Order $order, string $action, User $actor, array $meta = []): Order
    {
        $this->assertAllowedAction($action, $actor->role);
        $this->assertOwnership($order, $action, $actor);
        $next = $this->targetState($order, $action, $actor);
        $this->assertTransition($order->delivery_state, $next);

        return $this->apply($order, $next, $action, $actor, $meta);
    }

    /**
     * Role-scope ownership: actors may only advance orders they are a party to.
     */
    protected function assertOwnership(Order $order, string $action, User $actor): void
    {
        if (in_array($actor->role, ['staff', 'admin'], true)) {
            return; // staff/admin override everything
        }

        if ($actor->role === 'merchant') {
            $owns = $order->items()->whereHas('product', fn ($p) => $p->where('merchant_id', $actor->id))->exists();
            if (! $owns) {
                abort(403, 'You can only act on orders containing your products.');
            }
            return;
        }

        if ($actor->role === 'rider') {
            if ($order->rider_id !== $actor->id) {
                abort(403, 'This order is not assigned to you.');
            }
            return;
        }

        if ($actor->role === 'customer' && $action === 'cancel') {
            if ($order->customer_id !== $actor->id) {
                abort(403, 'You can only cancel your own orders.');
            }
        }
    }

    protected function assertAllowedAction(string $action, string $role): void
    {
        $allowed = self::ACTIONS[$action] ?? [];
        if (! in_array($role, $allowed, true)) {
            abort(403, "Role '{$role}' cannot perform '{$action}'.");
        }
    }

    /**
     * Map an action to its target state, with role-aware validation.
     */
    protected function targetState(Order $order, string $action, User $actor): string
    {
        $state = $order->delivery_state;

        return match ($action) {
            'accept' => Order::STATE_PREPARING,
            'reject' => Order::STATE_CANCELLED,
            'mark_ready' => Order::STATE_READY_FOR_PICKUP,
            'assign_raider' => Order::STATE_RAIDER_ASSIGNED,
            'accept_job' => Order::STATE_RAIDER_ASSIGNED,
            'depart_to_merchant' => Order::STATE_RAIDER_EN_ROUTE,
            'arrive_merchant' => Order::STATE_AT_MERCHANT,
            'pickup_order' => Order::STATE_IN_TRANSIT,
            'arrive_customer' => Order::STATE_ARRIVED,
            'complete_delivery' => Order::STATE_DELIVERED,
            'cancel' => Order::STATE_CANCELLED,
            'force_cancel' => Order::STATE_CANCELLED,
            'override' => $meta['to'] ?? throw new RuntimeException('override requires target state'),
            default => throw new RuntimeException("Unknown action: {$action}"),
        };
    }

    protected function assertTransition(string $from, string $to): void
    {
        if ($from === $to) {
            return;
        }
        $allowed = self::TRANSITIONS[$from] ?? [];
        if (! in_array($to, $allowed, true)) {
            abort(422, "Cannot move order from '{$from}' to '{$to}'.");
        }
    }

    protected function apply(Order $order, string $to, string $action, User $actor, array $meta): Order
    {
        $order->delivery_state = $to;

        // Mirror the legacy fields so existing UIs stay consistent
        $order->status = match ($to) {
            Order::STATE_PENDING_MERCHANT => 'paid',
            Order::STATE_PREPARING => 'paid',
            Order::STATE_READY_FOR_PICKUP => 'paid',
            Order::STATE_RAIDER_ASSIGNED, Order::STATE_RAIDER_EN_ROUTE, Order::STATE_AT_MERCHANT => 'assigned',
            Order::STATE_IN_TRANSIT => 'out_for_delivery',
            Order::STATE_ARRIVED => 'out_for_delivery',
            Order::STATE_DELIVERED => 'delivered',
            Order::STATE_CANCELLED => 'cancelled',
            default => $order->status,
        };
        $order->fulfillment_status = match ($to) {
            Order::STATE_PREPARING, Order::STATE_PENDING_MERCHANT => Order::FULFILL_ACCEPTED,
            Order::STATE_READY_FOR_PICKUP, Order::STATE_RAIDER_ASSIGNED, Order::STATE_RAIDER_EN_ROUTE => Order::FULFILL_SENDING,
            Order::STATE_AT_MERCHANT, Order::STATE_IN_TRANSIT, Order::STATE_ARRIVED => Order::FULFILL_COURIER_ACCEPTED,
            Order::STATE_DELIVERED => Order::FULFILL_DELIVERED,
            Order::STATE_CANCELLED => Order::FULFILL_CANCELLED,
            default => $order->fulfillment_status,
        };

        // Timestamps + proof-of-delivery
        $order->accepted_at = match ($action) { 'accept' => now(), default => $order->accepted_at };
        $order->ready_at = match ($action) { 'mark_ready' => now(), default => $order->ready_at };
        $order->rider_pickup_at = match ($action) { 'pickup_order' => now(), default => $order->rider_pickup_at };
        $order->cancel_reason = $meta['reason'] ?? $order->cancel_reason;

        if ($action === 'complete_delivery') {
            $order->delivery_pin = $meta['pin'] ?? $order->delivery_pin;
            $order->delivery_photo_url = $meta['photo_url'] ?? $order->delivery_photo_url;
        }

        $order->save();

        // Release COD payouts when delivered (collect cash at hand-off)
        if ($to === Order::STATE_DELIVERED && $order->payment_method === 'cod') {
            app(MarketplaceService::class)->releaseOrderPayouts($order);
        }

        // On cancellation: void any held affiliate commissions (the money was
        // never credited — it stays in escrow) and reverse payouts that were
        // already released (merchant / platform / rider) back into escrow.
        if ($to === Order::STATE_CANCELLED) {
            app(AffiliateService::class)->voidPendingForOrder($order);
            app(WalletService::class)->refundOrder($order, $order->cancel_reason ?? 'Order cancelled');
        }

        // Notifications to all parties
        app(NotificationService::class)->customerOrder(
            $order->customer_id,
            "Order #{$order->id} — ".str_replace('_', ' ', $to),
            'Your order status has been updated.',
            ['order_id' => $order->id, 'delivery_state' => $to],
        );

        // Broadcast the state change over the notification feed
        app(NotificationService::class)->sendToRole('staff', "Order #{$order->id} → {$to}", null, 'order_state', '📦');

        return $order->fresh();
    }

    /**
     * Auto-cancel an order that has been pending merchant acceptance too long,
     * reverting any payouts (refund). Returns true when cancelled.
     */
    public function autoCancel(Order $order, string $reason): bool
    {
        if ($order->delivery_state !== Order::STATE_PENDING_MERCHANT) {
            return false;
        }

        $order->update(['delivery_state' => Order::STATE_CANCELLED, 'status' => 'cancelled', 'cancel_reason' => $reason]);

        app(AffiliateService::class)->voidPendingForOrder($order);
        app(WalletService::class)->refundOrder($order, $reason);

        return true;
    }

    /**
     * Generate a one-time 4-digit delivery PIN (sent to the customer).
     */
    public function generatePin(Order $order): string
    {
        $pin = (string) random_int(1000, 9999);
        $order->update(['delivery_pin' => $pin]);

        return $pin;
    }
}
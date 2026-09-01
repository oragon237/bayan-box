<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Delivery assignment engine (items 3 & 4).
 *
 * Round-robin assignment of doorstep-delivery orders to active riders based
 * on current load (fewest active assigned deliveries first). Refused orders
 * are automatically reassigned to the next rider in rotation.
 */
class DeliveryAssignmentService
{
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_OUT_FOR_DELIVERY = 'out_for_delivery';
    public const STATUS_DELIVERED = 'delivered';
    public const STATUS_AWAITING = 'pending_assignment';

    /**
     * Unassigned doorstep-delivery orders ready to be dispatched.
     */
    public function unassignedDeliveries(): \Illuminate\Database\Eloquent\Builder
    {
        return Order::with(['customer:id,name,phone', 'hub:id,name'])
            ->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
            ->where('delivery_state', Order::STATE_READY_FOR_PICKUP)
            ->whereNull('rider_id');
    }

    /**
     * Assign an order to a rider using round-robin (least-load-first).
     * Returns the assigned rider, or null when no active riders exist.
     */
    public function assign(Order $order, ?int $assignedById = null): ?User
    {
        $this->assertDispatchable($order);

        $rider = $this->nextRider();

        if (! $rider) {
            $order->update([
                'status' => self::STATUS_AWAITING,
                'rider_id' => null,
                'delivery_state' => Order::STATE_READY_FOR_PICKUP,
            ]);

            return null;
        }

        $this->assignTo($order, $rider, 'auto', $assignedById);

        return $rider;
    }

    /**
     * Assign a ready order to a specific active rider. Assignment is the
     * single handoff from merchant fulfilment into the rider route.
     */
    public function assignTo(Order $order, User $rider, string $method = 'manual', ?int $assignedById = null): Order
    {
        $this->assertDispatchable($order);

        if ($rider->role !== 'rider' || $rider->status !== User::STATUS_ACTIVE) {
            throw new \RuntimeException('Choose an active rider for this delivery.');
        }

        return DB::transaction(function () use ($order, $rider, $method, $assignedById) {
            $order->update([
                'rider_id' => $rider->id,
                'status' => self::STATUS_ASSIGNED,
                'delivery_state' => Order::STATE_RAIDER_ASSIGNED,
                'fulfillment_status' => Order::FULFILL_SENDING,
                'dispatch_method' => $method,
                'assigned_by_id' => $assignedById,
            ]);

            return $order->fresh();
        });
    }

    /**
     * Refuse an assigned order — clears the rider and reassigns round-robin.
     */
    public function refuse(Order $order): ?User
    {
        if (! in_array($order->delivery_state, [Order::STATE_RAIDER_ASSIGNED, Order::STATE_RAIDER_EN_ROUTE], true)) {
            throw new \RuntimeException('A delivery can only be reassigned before pickup.');
        }

        DB::transaction(function () use ($order) {
            $order->update([
                'rider_id' => null,
                'status' => 'paid',
                'delivery_state' => Order::STATE_READY_FOR_PICKUP,
            ]);
        });

        return $this->assign($order);
    }

    /**
     * Mark a delivery as out-for-delivery (rider departed with the order).
     */
    public function markOutForDelivery(Order $order): void
    {
        if ($order->status !== self::STATUS_ASSIGNED) {
            throw new \RuntimeException('Order must be assigned before going out for delivery.');
        }

        $order->update(['status' => self::STATUS_OUT_FOR_DELIVERY]);
    }

    /**
     * Mark a delivery completed.
     */
    public function markDelivered(Order $order): void
    {
        $order->update(['status' => self::STATUS_DELIVERED]);
    }

    protected function assertDispatchable(Order $order): void
    {
        if ($order->fulfillment_type !== Order::FULFILLMENT_DELIVERY) {
            throw new \RuntimeException('Only doorstep-delivery orders can be assigned to riders.');
        }

        if ($order->delivery_state !== Order::STATE_READY_FOR_PICKUP || $order->rider_id !== null) {
            throw new \RuntimeException('Only an unassigned order that is ready for pickup can be dispatched.');
        }
    }

    /**
     * Round-robin: pick the active rider with the fewest current deliveries.
     */
    public function nextRider(): ?User
    {
        return User::where('role', 'rider')
            ->where('status', User::STATUS_ACTIVE)
            ->withCount(['deliveries as active_deliveries' => function ($q) {
                $q->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
                    ->whereIn('delivery_state', [
                        Order::STATE_RAIDER_ASSIGNED,
                        Order::STATE_RAIDER_EN_ROUTE,
                        Order::STATE_AT_MERCHANT,
                        Order::STATE_IN_TRANSIT,
                        Order::STATE_ARRIVED,
                    ]);
            }])
            ->orderBy('active_deliveries')
            ->orderBy('id')
            ->first();
    }
}

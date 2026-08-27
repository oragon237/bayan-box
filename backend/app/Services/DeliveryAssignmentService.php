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
            ->whereIn('status', ['paid', 'pending_payment', self::STATUS_AWAITING])
            ->whereNull('rider_id');
    }

    /**
     * Assign an order to a rider using round-robin (least-load-first).
     * Returns the assigned rider, or null when no active riders exist.
     */
    public function assign(Order $order): ?User
    {
        if ($order->fulfillment_type !== Order::FULFILLMENT_DELIVERY) {
            throw new \RuntimeException('Only doorstep-delivery orders can be assigned to riders.');
        }

        $rider = $this->nextRider();

        if (! $rider) {
            $order->update(['status' => self::STATUS_AWAITING]);

            return null;
        }

        DB::transaction(function () use ($order, $rider) {
            $order->update([
                'rider_id' => $rider->id,
                'status' => self::STATUS_ASSIGNED,
            ]);
        });

        return $rider;
    }

    /**
     * Refuse an assigned order — clears the rider and reassigns round-robin.
     */
    public function refuse(Order $order): ?User
    {
        DB::transaction(function () use ($order) {
            $order->update([
                'rider_id' => null,
                'status' => self::STATUS_AWAITING,
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

    /**
     * Round-robin: pick the active rider with the fewest current deliveries.
     */
    public function nextRider(): ?User
    {
        return User::where('role', 'rider')
            ->where('status', User::STATUS_ACTIVE)
            ->withCount(['deliveries as active_deliveries' => function ($q) {
                $q->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
                    ->whereIn('status', [self::STATUS_ASSIGNED, self::STATUS_OUT_FOR_DELIVERY]);
            }])
            ->orderBy('active_deliveries')
            ->orderBy('id')
            ->first();
    }
}
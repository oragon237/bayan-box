<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\OrderStateMachine;
use Illuminate\Console\Command;

/**
 * Order lifecycle exception handling (edge cases):
 *  - Auto-cancel orders pending merchant acceptance for > 10 minutes.
 *  - Return to the pickup pool any raider-assigned order where the raider
 *    has not moved toward the merchant within 5 minutes.
 */
class ProcessOrderLifecycle extends Command
{
    protected $signature = 'orders:process-lifecycle';

    protected $description = 'Auto-cancel unaccepted orders and reassign stalled raider deliveries';

    public function handle(OrderStateMachine $machine): int
    {
        $processed = 0;

        // 1. Auto-cancel: pending merchant acceptance > 10 minutes
        $stale = Order::where('delivery_state', Order::STATE_PENDING_MERCHANT)
            ->where('created_at', '<', now()->subMinutes(10))
            ->where('status', '!=', 'cancelled')
            ->get();

        foreach ($stale as $order) {
            if ($machine->autoCancel($order, 'Merchant did not accept within 10 minutes.')) {
                $this->info("Auto-cancelled Order #{$order->id} (merchant timeout)");
                $processed++;
            }
        }

        // 2. Raider reassignment: assigned but raider has not moved for 5 minutes
        $stalled = Order::where('delivery_state', Order::STATE_RAIDER_ASSIGNED)
            ->where('updated_at', '<', now()->subMinutes(5))
            ->where('status', '!=', 'cancelled')
            ->get();

        foreach ($stalled as $order) {
            $order->update([
                'delivery_state' => Order::STATE_READY_FOR_PICKUP,
                'rider_id' => null,
                'status' => 'paid',
            ]);
            $this->info("Order #{$order->id} returned to pickup pool (raider stalled)");
            $processed++;
        }

        $this->info("Order lifecycle: processed {$processed} exception(s).");

        return self::SUCCESS;
    }
}
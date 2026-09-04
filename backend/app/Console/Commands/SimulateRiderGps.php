<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\RiderLocation;
use App\Services\OrderStateMachine;
use Illuminate\Console\Command;

/**
 * TEST-ONLY: streams simulated GPS fixes for the rider assigned to an order,
 * moving along a curved path from the merchant (pickup) to the drop-off, so
 * the live-tracking screen can be exercised without a real rider device.
 */
class SimulateRiderGps extends Command
{
    protected $signature = 'orders:simulate-gps
        {order : Order id to simulate rider GPS for}
        {--duration=180 : Seconds the simulated trip lasts}
        {--interval=5 : Seconds between simulated GPS fixes}
        {--arrive : Mark the order arrived when the trip completes}';

    protected $description = 'Simulate rider GPS fixes moving from merchant to customer for an order (dev testing only)';

    public function handle(OrderStateMachine $machine): int
    {
        $order = Order::with([
            'items.product.merchant',
            'rider:id,name,phone',
        ])->find($this->argument('order'));

        if (!$order) {
            $this->error("Order #{$this->argument('order')} not found.");
            return 1;
        }
        if (!$order->rider_id || !$order->rider) {
            $this->error('This order has no rider assigned (assign one on /staff/dispatch first).');
            return 1;
        }
        if (!$order->latitude || !$order->longitude) {
            $this->error('Order has no drop-off coordinates to travel toward.');
            return 1;
        }

        $merchant = $order->items->first()?->product?->merchant;
        if (!$merchant || !$merchant->latitude || !$merchant->longitude) {
            $this->error('Merchant has no coordinates; cannot start the trip at the store.');
            return 1;
        }

        $from = [(float) $merchant->latitude, (float) $merchant->longitude];
        $to = [(float) $order->latitude, (float) $order->longitude];
        $interval = max(1, (int) $this->option('interval'));
        $duration = max($interval * 2, (int) $this->option('duration'));
        $steps = intdiv($duration, $interval);
        $avgSpeed = $this->haversineM($from, $to) / max(1, $duration);

        RiderLocation::where('rider_id', $order->rider_id)->delete();
        $this->info("Simulating {$order->rider->name} ({$order->rider->phone}) for order #{$order->id}");
        $this->line('  from merchant '.implode(', ', $from).' -> drop-off '.implode(', ', $to));
        $this->line("  ~{$duration}s, one fix every {$interval}s, ETA in UI ≈".round($avgSpeed ? $duration / 60 : 0, 1).' min');

        $ctrl = $this->controlPoint($from, $to);

        for ($i = 1; $i <= $steps; $i++) {
            $t = $i / $steps;
            $pos = $this->bezier($from, $ctrl, $to, $t);
            $prev = $this->bezier($from, $ctrl, $to, max(0, ($i - 1) / $steps));

            RiderLocation::create([
                'rider_id' => $order->rider_id,
                'latitude' => $pos[0],
                'longitude' => $pos[1],
                'accuracy_m' => 12,
                'speed_mps' => round($avgSpeed, 2),
                'heading_deg' => $this->bearing($prev, $pos),
                'recorded_at' => now(),
            ]);

            $this->line(sprintf('  [%2d/%d] t=%.2f  %.6f, %.6f', $i, $steps, $t, $pos[0], $pos[1]));

            if ($i < $steps) {
                sleep($interval);
            }
        }

        if ($this->option('arrive')) {
            try {
                $machine->transition($order->fresh(), 'arrive_customer', $order->rider);
                $this->info("Order #{$order->id} marked arrived.");
            } catch (\Throwable $e) {
                $this->warn('Could not mark arrived: '.$e->getMessage());
            }
        }

        $this->info('Simulation finished — rider is parked at the drop-off.');
        return 0;
    }

    /** Perpendicular midpoint offset so the trip is not a dead-straight line. */
    protected function controlPoint(array $a, array $b): array
    {
        $mid = [($a[0] + $b[0]) / 2, ($a[1] + $b[1]) / 2];
        $dLat = $b[0] - $a[0];
        $dLng = $b[1] - $a[1];
        $len = max(1e-9, sqrt($dLat ** 2 + $dLng ** 2));

        return [$mid[0] + (-$dLng / $len) * $len * 0.3, $mid[1] + ($dLat / $len) * $len * 0.3];
    }

    protected function bezier(array $a, array $c, array $b, float $t): array
    {
        $u = 1 - $t;

        return [
            $u * $u * $a[0] + 2 * $u * $t * $c[0] + $t * $t * $b[0],
            $u * $u * $a[1] + 2 * $u * $t * $c[1] + $t * $t * $b[1],
        ];
    }

    protected function bearing(array $a, array $b): float
    {
        return round((rad2deg(atan2($b[1] - $a[1], $b[0] - $a[0])) + 360) % 360, 1);
    }

    protected function haversineM(array $a, array $b): float
    {
        $dLat = deg2rad($b[0] - $a[0]);
        $dLng = deg2rad($b[1] - $a[1]);
        $h = sin($dLat / 2) ** 2 + cos(deg2rad($a[0])) * cos(deg2rad($b[0])) * sin($dLng / 2) ** 2;

        return 6371000 * 2 * asin(min(1, sqrt($h)));
    }
}

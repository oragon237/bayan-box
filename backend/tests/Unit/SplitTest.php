<?php

namespace Tests\Unit;

use App\Services\DeliveryPricingService;
use Mockery;
use Tests\TestCase;

class SplitTest extends TestCase
{
    private function makeService(): DeliveryPricingService
    {
        $distanceMock = Mockery::mock('App\Services\DistanceMatrixService');
        $distanceMock->shouldReceive('distance')
            ->andReturn(['distance_meters' => 5000, 'duration_seconds' => 600, 'provider' => 'mock']);
        return new DeliveryPricingService($distanceMock);
    }

    public function test_split_fee_15_percent_platform(): void
    {
        $result = $this->makeService()->splitFee(100.00);
        $this->assertEquals(15.00, $result['platform_share']);
        $this->assertEquals(85.00, $result['rider_share']);
        $this->assertEquals(100.00, $result['total_delivery_fee']);
        $this->assertEquals(15.00, $result['platform_percentage']);
    }

    public function test_split_fee_zero(): void
    {
        $result = $this->makeService()->splitFee(0.00);
        $this->assertEquals(0.00, $result['platform_share']);
        $this->assertEquals(0.00, $result['rider_share']);
    }

    public function test_split_fee_rounds_correctly(): void
    {
        $result = $this->makeService()->splitFee(247.00);
        $this->assertEquals(37.05, $result['platform_share']);
        $this->assertEquals(209.95, $result['rider_share']);
    }

    public function test_revenue_splits_reconcile_to_100_percent(): void
    {
        $totals = [0.00, 0.01, 0.50, 1.00, 10.00, 100.00, 247.00, 999.99, 5000.00];
        foreach ($totals as $total) {
            $result = $this->makeService()->splitFee($total);
            $sum = round($result['platform_share'] + $result['rider_share'], 2);
            $this->assertEquals($total, $sum, "Split sum mismatch for total=$total: platform={$result['platform_share']} + rider={$result['rider_share']} = $sum");
        }
    }

    public function test_delivery_over_100km_blocked(): void
    {
        $distanceMock = Mockery::mock('App\Services\DistanceMatrixService');
        $distanceMock->shouldReceive('distance')
            ->andReturn(['distance_meters' => 150000, 'duration_seconds' => 6000, 'provider' => 'mock']);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('outside our');
        (new DeliveryPricingService($distanceMock))->calculateFee(14.0, 121.0, 16.0, 120.0);
    }
}
<?php

namespace App\Services;

use App\Models\DeliveryRateSetting;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * Dynamic per-kilometer provincial delivery fee calculator (FR-CALC-001..006).
 *
 * Algorithm:
 *  1. Load municipality rate settings (fallback to global defaults).
 *  2. Resolve road distance via DistanceMatrixService (Mapbox / ORS).
 *  3. totalFee = baseFare + max(0, excessKm) × perKmRate.
 *  4. Apply surge multiplier (night / weather override).
 *  5. Split 85% rider / 15% platform (configurable per municipality).
 *  6. Return itemised breakdown.
 */
class DeliveryPricingService
{
    public function __construct(
        protected DistanceMatrixService $distanceMatrix,
    ) {}

    /**
     * Split a known total fee into platform and rider shares using the default
     * municipality platform percentage. Used by ParcelService on delivery.
     */
    public function splitFee(float $totalFee, ?string $municipality = null): array
    {
        $settings = $this->resolveSettings($municipality);
        $platformPct = (float) $settings['platform_percentage'];

        $platformShare = round($totalFee * ($platformPct / 100), 2);
        $riderShare = round($totalFee - $platformShare, 2);

        return [
            'total_delivery_fee' => $totalFee,
            'platform_share' => $platformShare,
            'rider_share' => $riderShare,
            'platform_percentage' => $platformPct,
        ];
    }

    /**
     * Calculate the full delivery fee breakdown.
     *
     * @param  float  $originLat
     * @param  float  $originLng
     * @param  float  $destLat
     * @param  float  $destLng
     * @param  string|null  $municipality  Used to look up rate settings; falls
     *                                     back to config defaults when null.
     * @return array{  distance_km: float,
     *                 duration_seconds: float,
     *                 total_delivery_fee: float,
     *                 platform_share: float,
     *                 rider_share: float,
     *                 applied_surge: float,
     *                 base_fare: float,
     *                 per_km_surcharge: float,
     *                 eta_minutes: float,
     *                 provider: string }
     */
    public function calculateFee(
        float $originLat,
        float $originLng,
        float $destLat,
        float $destLng,
        ?string $municipality = null,
    ): array {
        $settings = $this->resolveSettings($municipality);

        // 2. Driving distance from provider
        $route = $this->distanceMatrix->distance($originLat, $originLng, $destLat, $destLng);
        $distanceKm = round($route['distance_meters'] / 1000.0, 2);

        // 2b. Service-area guard: refuse deliveries beyond the configured max
        // radius instead of quoting a runaway linear fee (Fix — out-of-range).
        $maxKm = (float) config('bayanbox.marketplace.max_delivery_km', 50);
        if ($distanceKm > $maxKm) {
            throw new \RuntimeException(sprintf(
                'This location is %.1f km away — outside our %.0f km delivery area. Please choose a nearer address or Click & Collect.',
                $distanceKm,
                $maxKm,
            ));
        }

        // 3. Fee algorithm
        $baseFare = (float) $settings['base_fare'];
        $baseDistanceKm = (float) $settings['base_distance_km'];
        $perKmRate = (float) $settings['per_km_rate'];

        $perKmSurcharge = 0.0;
        if ($distanceKm > $baseDistanceKm) {
            $excessKm = $distanceKm - $baseDistanceKm;
            $perKmSurcharge = round($excessKm * $perKmRate, 2);
        }

        $totalFee = $baseFare + $perKmSurcharge;

        // 4. Surge
        $surge = $this->resolveSurge($settings);
        $totalFee = round($totalFee * $surge, 0);

        // 5. Revenue split
        $platformPct = (float) $settings['platform_percentage'];
        $platformShare = round($totalFee * ($platformPct / 100), 2);
        $riderShare = $totalFee - $platformShare;

        // 6. ETA (FR-MAP-004)
        $etaMinutes = $this->calculateEta($route['duration_seconds']);

        return [
            'distance_km' => $distanceKm,
            'duration_seconds' => (int) $route['duration_seconds'],
            'total_delivery_fee' => $totalFee,
            'platform_share' => $platformShare,
            'rider_share' => $riderShare,
            'applied_surge' => $surge,
            'base_fare' => $baseFare,
            'per_km_surcharge' => $perKmSurcharge,
            'eta_minutes' => $etaMinutes['min'],
            'eta_max_minutes' => $etaMinutes['max'],
            'provider' => $route['provider'] ?? 'unknown',
            'cached' => $route['cached'] ?? false,
        ];
    }

    /**
     * Load rate settings for a municipality, falling back to sensible defaults.
     */
    protected function resolveSettings(?string $municipality): array
    {
        if ($municipality) {
            $row = DeliveryRateSetting::where('municipality_name', $municipality)->first();
            if ($row) {
                return $row->toArray();
            }
        }

        return [
            'base_fare' => 35.00,
            'base_distance_km' => 2.00,
            'per_km_rate' => 10.00,
            'platform_percentage' => config('bayanbox.delivery_splits.platform_percentage', 15.00),
            'rider_percentage' => config('bayanbox.delivery_splits.rider_percentage', 85.00),
            'surge_multiplier' => 1.00,
            'surge_override_active' => false,
        ];
    }

    /**
     * Resolve the effective surge multiplier (FR-CALC-006).
     *
     * Priority: manual override > night surge > 1.0x
     */
    protected function resolveSurge(array $settings): float
    {
        // Manual admin override stored in the row
        if (! empty($settings['surge_override_active']) && (float) $settings['surge_multiplier'] !== 1.0) {
            return (float) $settings['surge_multiplier'];
        }

        // Automatic night surge (configurable hours)
        if (config('bayanbox.surge.night_surge_enabled', false)) {
            $now = Carbon::now();
            $start = (int) config('bayanbox.surge.night_start_hour', 21);
            $end = (int) config('bayanbox.surge.night_end_hour', 6);
            $hour = $now->hour;

            if ($hour >= $start || $hour < $end) {
                return (float) config('bayanbox.surge.night_surge_multiplier', 1.50);
            }
        }

        // Weather surge (toggled manually by admin via API)
        if (config('bayanbox.surge.weather_surge_enabled', false)) {
            return (float) config('bayanbox.surge.weather_surge_multiplier', 1.50);
        }

        return 1.00;
    }

    /**
     * Provincial ETA buffer (FR-MAP-004).
     * Multiplies raw duration by 1.30x, then returns a friendly range (± spread).
     */
    protected function calculateEta(float $durationSeconds): array
    {
        $multiplier = (float) config('bayanbox.eta.buffer_multiplier', 1.30);
        $spread = (int) config('bayanbox.eta.range_spread_minutes', 7);

        $bufferedMinutes = ($durationSeconds * $multiplier) / 60.0;
        $min = max(1, (int) round($bufferedMinutes - $spread / 2));
        $max = (int) round($bufferedMinutes + $spread / 2);

        return compact('min', 'max');
    }
}
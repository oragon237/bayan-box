<?php

namespace App\Services;

use App\Support\Geohash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Driving distance matrix provider abstraction.
 *
 * Resolves road distance + duration from Mapbox Directions or OpenRouteService
 * (FR-CALC-002). Responses are cached by rounded geohash pair so recurring
 * address routes never double-bill the provider (NFR 6.1).
 */
class DistanceMatrixService
{
    public const CACHE_PREFIX = 'route_distance_v1:';

    public function distance(float $originLat, float $originLng, float $destLat, float $destLng): array
    {
        $cacheEnabled = (bool) config('bayanbox.distance_cache.enabled', true);
        $precision = (int) config('bayanbox.distance_cache.geohash_precision', 6);

        if ($cacheEnabled) {
            $key = $this->cacheKey($originLat, $originLng, $destLat, $destLng, $precision);
            $cached = Cache::get($key);
            if ($cached !== null) {
                return array_merge($cached, ['cached' => true]);
            }
        }

        $provider = config('bayanbox.distance_provider', 'mapbox');
        try {
            $result = $provider === 'openrouteservice'
                ? $this->fetchOpenRouteService($originLat, $originLng, $destLat, $destLng)
                : $this->fetchMapbox($originLat, $originLng, $destLat, $destLng);
        } catch (RuntimeException $mapboxError) {
            // Fail over to the alternate provider before falling back to haversine.
            Log::warning('bayanbox.distance_provider_failed', [
                'provider' => $provider,
                'error' => $mapboxError->getMessage(),
            ]);

            try {
                $result = $provider === 'openrouteservice'
                    ? $this->fetchMapbox($originLat, $originLng, $destLat, $destLng)
                    : $this->fetchOpenRouteService($originLat, $originLng, $destLat, $destLng);
            } catch (RuntimeException $orsError) {
                $result = $this->haversineFallback($originLat, $originLng, $destLat, $destLng);
            }
        }

        if ($cacheEnabled) {
            Cache::put($key, $result, (int) config('bayanbox.distance_cache.ttl', 604800));
        }

        return array_merge($result, ['cached' => false]);
    }

    protected function cacheKey(float $olat, float $olng, float $dlat, float $dlng, int $precision): string
    {
        $o = Geohash::encode($olat, $olng, $precision);
        $d = Geohash::encode($dlat, $dlng, $precision);

        // Order-independent so A->B and B->A hit the same bucket.
        $pair = $o <= $d ? "{$o}:{$d}" : "{$d}:{$o}";

        return self::CACHE_PREFIX.$pair;
    }

    protected function fetchMapbox(float $olat, float $olng, float $dlat, float $dlng): array
    {
        $token = config('bayanbox.mapbox.access_token');
        if (blank($token)) {
            throw new RuntimeException('MAPBOX_ACCESS_TOKEN is not configured.');
        }

        $url = sprintf(
            '%s/%s,%s;%s,%s',
            config('bayanbox.mapbox.base_url'),
            $olng, $olat, $dlng, $dlat
        );

        $response = Http::timeout(10)
            ->retry(2, 250)
            ->get($url, [
                'access_token' => $token,
                'geometries' => 'geojson',
                'overview' => 'simplified',
            ]);

        if ($response->failed() || empty($response['routes'][0]['distance'])) {
            throw new RuntimeException('Mapbox Directions API returned no route.');
        }

        return [
            'distance_meters' => (float) $response['routes'][0]['distance'],
            'duration_seconds' => (float) $response['routes'][0]['duration'],
            'provider' => 'mapbox',
        ];
    }

    protected function fetchOpenRouteService(float $olat, float $olng, float $dlat, float $dlng): array
    {
        $apiKey = config('bayanbox.openrouteservice.api_key');
        if (blank($apiKey)) {
            throw new RuntimeException('ORS_API_KEY is not configured.');
        }

        $url = sprintf(
            '%s/%s',
            config('bayanbox.openrouteservice.base_url'),
            config('bayanbox.openrouteservice.profile')
        );

        $response = Http::timeout(10)
            ->retry(2, 250)
            ->withHeaders(['Authorization' => $apiKey])
            ->post($url, [
                'coordinates' => [[$olng, $olat], [$dlng, $dlat]],
                'instructions' => false,
            ]);

        if ($response->failed() || empty($response['routes'][0]['summary']['distance'])) {
            throw new RuntimeException('OpenRouteService returned no route.');
        }

        return [
            'distance_meters' => (float) $response['routes'][0]['summary']['distance'],
            'duration_seconds' => (float) $response['routes'][0]['summary']['duration'],
            'provider' => 'openrouteservice',
        ];
    }

    /**
     * Crow-flies estimate with a 1.42x road sinuosity factor. Used only when
     * every paid provider is unreachable so the calculator never hard-fails.
     */
    protected function haversineFallback(float $olat, float $olng, float $dlat, float $dlng): array
    {
        $earthRadiusM = 6371000.0;

        $dLat = deg2rad($dlat - $olat);
        $dLng = deg2rad($dlng - $olng);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($olat)) * cos(deg2rad($dlat)) * sin($dLng / 2) ** 2;

        $meters = $earthRadiusM * 2 * atan2(sqrt($a), sqrt(1 - $a));
        $roadMeters = $meters * 1.42; // road sinuosity
        $avgSpeedMps = 8.33; // ~30 km/h provincial traffic

        return [
            'distance_meters' => round($roadMeters, 2),
            'duration_seconds' => round($roadMeters / $avgSpeedMps, 2),
            'provider' => 'haversine_fallback',
        ];
    }
}

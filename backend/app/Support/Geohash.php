<?php

namespace App\Support;

/**
 * Compact geohash encoder/decoder used to bucket route requests for
 * provider-billing deduplication (NFR 6.1).
 */
class Geohash
{
    private const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

    public static function encode(float $latitude, float $longitude, int $precision = 6): string
    {
        $latMin = -90.0;
        $latMax = 90.0;
        $lngMin = -180.0;
        $lngMax = 180.0;

        $hash = '';
        $bit = 0;
        $ch = 0;
        $even = true;

        while (strlen($hash) < $precision) {
            if ($even) {
                $mid = ($lngMin + $lngMax) / 2;
                if ($longitude >= $mid) {
                    $ch |= (1 << (4 - $bit));
                    $lngMin = $mid;
                } else {
                    $lngMax = $mid;
                }
            } else {
                $mid = ($latMin + $latMax) / 2;
                if ($latitude >= $mid) {
                    $ch |= (1 << (4 - $bit));
                    $latMin = $mid;
                } else {
                    $latMax = $mid;
                }
            }

            $even = ! $even;
            if ($bit < 4) {
                $bit++;
            } else {
                $hash .= self::BASE32[$ch];
                $bit = 0;
                $ch = 0;
            }
        }

        return $hash;
    }
}

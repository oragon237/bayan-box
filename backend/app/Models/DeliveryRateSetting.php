<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryRateSetting extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'municipality_name', 'base_fare', 'base_distance_km',
        'per_km_rate', 'platform_percentage', 'rider_percentage',
        'surge_multiplier', 'surge_override_active',
    ];

    protected function casts(): array
    {
        return [
            'surge_override_active' => 'boolean',
        ];
    }
}
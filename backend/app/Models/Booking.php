<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    protected $fillable = [
        'customer_id', 'provider_id', 'service_id', 'status',
        'booking_date', 'address', 'latitude', 'longitude',
        'quoted_amount', 'platform_commission', 'provider_payout',
        'rework_reason',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(ServiceCategory::class, 'service_id');
    }
}
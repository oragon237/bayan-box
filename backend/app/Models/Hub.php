<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hub extends Model
{
    protected $fillable = [
        'name', 'address', 'barangay', 'municipality',
        'latitude', 'longitude', 'staff_id', 'capacity_limit',
        'current_parcel_count', 'referral_code',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
        ];
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function parcels(): HasMany
    {
        return $this->hasMany(Parcel::class);
    }

    public function deliveryBatches(): HasMany
    {
        return $this->hasMany(DeliveryBatch::class);
    }

    public function promoCodes(): HasMany
    {
        return $this->hasMany(PromoCode::class);
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromoCode extends Model
{
    protected $fillable = [
        'code', 'description', 'discount_type', 'discount_value',
        'min_transaction_amount', 'hub_id', 'barangay', 'municipality',
        'min_parcels_per_transaction', 'max_uses', 'used_count',
        'starts_at', 'expires_at', 'is_active', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(PromoRedemption::class);
    }

    /**
     * Check whether a promo is geo-valid for a given hub / barangay.
     */
    public function appliesTo(?int $hubId, ?string $barangay): bool
    {
        if ($this->hub_id && $this->hub_id !== $hubId) {
            return false;
        }

        if ($this->barangay && $this->barangay !== $barangay) {
            return false;
        }

        return true;
    }
}
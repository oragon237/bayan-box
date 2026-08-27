<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'merchant_id', 'name', 'description', 'price', 'stock',
        'suki_points_award', 'affiliate_percentage', 'image_url',
        'category', 'status',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'stock' => 'integer',
            'suki_points_award' => 'integer',
            'affiliate_percentage' => 'decimal:2',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Storefront visibility: active and physically in stock (FR-MKT-004).
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active')->where('stock', '>', 0);
    }
}
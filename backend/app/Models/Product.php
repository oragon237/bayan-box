<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'merchant_id', 'name', 'unit', 'description', 'price', 'sale_price', 'stock',
        'low_stock_threshold',
        'points_price', 'points_only',
        'suki_points_award', 'affiliate_percentage', 'image_url',
        'category', 'status', 'is_official_mall', 'availability',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'stock' => 'integer',
            'low_stock_threshold' => 'integer',
            'points_price' => 'integer',
            'points_only' => 'boolean',
            'suki_points_award' => 'integer',
            'affiliate_percentage' => 'decimal:2',
            'is_official_mall' => 'boolean',
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

    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Current effective price (sale price when set).
     */
    public function effectivePrice(): float
    {
        return $this->sale_price !== null ? (float) $this->sale_price : (float) $this->price;
    }

    /**
     * Storefront visibility: active, physically in stock, and marked available.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active')
            ->where('stock', '>', 0)
            ->where('availability', 'available');
    }

    /**
     * BeCoolBox Mall flagship items (Module 2).
     */
    public function scopeOfficialMall(Builder $query): Builder
    {
        return $query->where('is_official_mall', true);
    }

    /**
     * Points-only products (buyable exclusively with Suki Points).
     */
    public function scopePointsOnly(Builder $query): Builder
    {
        return $query->where('points_only', true);
    }
}
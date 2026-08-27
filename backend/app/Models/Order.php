<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const FULFILLMENT_PICKUP = 'pickup';
    public const FULFILLMENT_DELIVERY = 'delivery';

    protected $fillable = [
        'customer_id', 'total_amount', 'shipping_amount', 'fulfillment_type',
        'hub_id', 'rider_id', 'delivery_address', 'latitude', 'longitude',
        'status', 'referring_affiliate_id',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'shipping_amount' => 'decimal:2',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }
}
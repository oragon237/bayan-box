<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'product_id', 'quantity', 'price_at_purchase',
        'suki_points_awarded', 'affiliate_payout_amount',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'price_at_purchase' => 'decimal:2',
            'suki_points_awarded' => 'integer',
            'affiliate_payout_amount' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
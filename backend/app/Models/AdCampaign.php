<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdCampaign extends Model
{
    protected $fillable = [
        'product_id', 'merchant_id', 'ad_type', 'title', 'daily_rate', 'duration_days',
        'total_cost', 'start_date', 'end_date', 'display_order', 'keywords',
        'status', 'payment_method',
        'impressions', 'clicks', 'conversions',
    ];

    protected function casts(): array
    {
        return [
            'daily_rate' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'duration_days' => 'integer',
            'display_order' => 'integer',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'impressions' => 'integer',
            'clicks' => 'integer',
            'conversions' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'merchant_id');
    }

    public function scopeActive($q)
    {
        return $q->where('status', 'active')->where('end_date', '>', now());
    }
}
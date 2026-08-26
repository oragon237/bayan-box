<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PackagingItem extends Model
{
    protected $fillable = [
        'name', 'sku', 'description', 'cash_price',
        'points_price', 'stock_qty', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(PackagingRedemption::class);
    }
}
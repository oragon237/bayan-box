<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackagingRedemption extends Model
{
    protected $fillable = [
        'user_id', 'packaging_item_id', 'quantity', 'points_spent', 'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function packagingItem(): BelongsTo
    {
        return $this->belongsTo(PackagingItem::class);
    }
}
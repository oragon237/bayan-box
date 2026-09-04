<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PabiliRequest extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_QUOTED = 'quoted';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_DECLINED = 'declined';
    public const STATUS_CONVERTED = 'converted';
    public const STATUS_CANCELLED = 'cancelled';

    // Mirrors the normal product pipeline after conversion (merchant→rider).
    protected $fillable = [
        'customer_id', 'status', 'delivery_address',
        'latitude', 'longitude', 'notes',
        'quoted_total', 'quoted_shipping', 'quoted_by_id', 'quote_note', 'quoted_at',
        'approved_at', 'decline_reason', 'order_id',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'quoted_total' => 'decimal:2',
            'quoted_shipping' => 'decimal:2',
            'quoted_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function quotedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'quoted_by_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PabiliItem::class);
    }
}

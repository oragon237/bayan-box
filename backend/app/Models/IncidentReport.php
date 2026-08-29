<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncidentReport extends Model
{
    protected $fillable = [
        'rider_id', 'order_id', 'type', 'description', 'latitude', 'longitude',
        'status', 'resolution_notes', 'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'resolved_at' => 'datetime',
        ];
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
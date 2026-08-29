<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Staff-recorded cash deposit from a rider covering COD collections.
 * Closes the physical cash loop: rider collects COD at delivery →
 * remits cash to the hub → staff records it here.
 */
class RiderCodRemittance extends Model
{
    protected $fillable = [
        'rider_id', 'amount', 'notes', 'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PabiliItem extends Model
{
    protected $fillable = [
        'pabili_request_id', 'product_name', 'details',
        'quantity', 'max_price', 'quoted_price', 'staff_note',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'max_price' => 'decimal:2',
            'quoted_price' => 'decimal:2',
        ];
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(PabiliRequest::class, 'pabili_request_id');
    }
}

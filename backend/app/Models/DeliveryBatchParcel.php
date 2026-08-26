<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryBatchParcel extends Model
{
    protected $fillable = [
        'delivery_batch_id', 'parcel_id', 'sequence',
        'dropoff_status', 'proof_photo_path',
    ];

    public function deliveryBatch(): BelongsTo
    {
        return $this->belongsTo(DeliveryBatch::class);
    }

    public function parcel(): BelongsTo
    {
        return $this->belongsTo(Parcel::class);
    }
}
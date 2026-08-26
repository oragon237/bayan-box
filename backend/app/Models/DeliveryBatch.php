<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryBatch extends Model
{
    protected $fillable = [
        'batch_code', 'hub_id', 'rider_id', 'barangay',
        'status', 'assigned_at', 'started_at', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    public function batchParcels(): HasMany
    {
        return $this->hasMany(DeliveryBatchParcel::class);
    }

    public function parcels(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Parcel::class, 'delivery_batch_parcels')
            ->withPivot('sequence', 'dropoff_status', 'proof_photo_path')
            ->withTimestamps();
    }
}
<?php

namespace App\Models;

use App\Enums\ParcelStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Parcel extends Model
{
    protected $fillable = [
        'tracking_number', 'shipper_name', 'recipient_name', 'recipient_phone',
        'hub_id', 'rider_id', 'status', 'otp_code', 'otp_expires_at', 'otp_attempts',
        'cod_amount', 'origin_address', 'origin_latitude', 'origin_longitude',
        'destination_address', 'destination_latitude', 'destination_longitude',
        'destination_barangay', 'delivery_distance_km', 'calculated_delivery_fee',
        'applied_surge', 'arrived_at_hub_at', 'picked_up_at', 'delivered_at',
        'referred_by_id', 'referral_commission_paid_at',
    ];

    protected function casts(): array
    {
        return [
            'otp_expires_at' => 'datetime',
            'arrived_at_hub_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cod_amount' => 'decimal:2',
            'calculated_delivery_fee' => 'decimal:2',
            'delivery_distance_km' => 'decimal:2',
        ];
    }

    public function isOtpValid(string $otp): bool
    {
        return $this->otp_code === $otp
            && $this->otp_expires_at && $this->otp_expires_at->isFuture()
            && $this->otp_attempts < 5;
    }

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(ParcelStatusHistory::class);
    }

    public function deliveryBatchParcels(): HasMany
    {
        return $this->hasMany(DeliveryBatchParcel::class);
    }
}
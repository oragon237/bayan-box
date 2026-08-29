<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    public const FULFILLMENT_PICKUP = 'pickup';
    public const FULFILLMENT_DELIVERY = 'delivery';

    // Merchant fulfillment workflow (legacy)
    public const FULFILL_PENDING = 'pending';
    public const FULFILL_ACCEPTED = 'accepted';
    public const FULFILL_PACKAGING = 'packaging';
    public const FULFILL_SENDING = 'sending_to_courier';
    public const FULFILL_COURIER_ACCEPTED = 'accepted_by_courier';

    // State machine states (item 3)
    public const STATE_PENDING_MERCHANT = 'pending_merchant';
    public const STATE_PREPARING = 'preparing';
    public const STATE_READY_FOR_PICKUP = 'ready_for_pickup';
    public const STATE_RAIDER_ASSIGNED = 'raider_assigned';
    public const STATE_RAIDER_EN_ROUTE = 'raider_en_route_to_merchant';
    public const STATE_AT_MERCHANT = 'at_merchant';
    public const STATE_IN_TRANSIT = 'in_transit';
    public const STATE_ARRIVED = 'arrived';
    public const STATE_DELIVERED = 'delivered';
    public const STATE_CANCELLED = 'cancelled';

    protected $fillable = [
        'customer_id', 'total_amount', 'shipping_amount', 'fulfillment_type',
        'hub_id', 'rider_id', 'delivery_address', 'latitude', 'longitude',
        'status', 'fulfillment_status', 'payment_method', 'referring_affiliate_id',
        'delivery_state', 'delivery_pin', 'delivery_photo_url',
        'accepted_at', 'ready_at', 'rider_pickup_at', 'cancel_reason',
        'dispatch_method', 'assigned_by_id',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'shipping_amount' => 'decimal:2',
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'accepted_at' => 'datetime',
            'ready_at' => 'datetime',
            'rider_pickup_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function hub(): BelongsTo
    {
        return $this->belongsTo(Hub::class);
    }
}
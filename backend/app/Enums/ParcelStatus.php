<?php

namespace App\Enums;

enum ParcelStatus: string
{
    case ReceivedAtHub = 'received_at_hub';
    case OutForDelivery = 'out_for_delivery';
    case Delivered = 'delivered';
    case Returned = 'returned';
    case PickedUp = 'picked_up';

    public static function values(): array
    {
        return array_map(fn (self $s) => $s->value, self::cases());
    }
}

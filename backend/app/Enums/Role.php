<?php

namespace App\Enums;

/**
 * RBAC roles (PRD section 2). Mirrors the `user_role` enum domain.
 */
enum Role: string
{
    case Admin = 'admin';
    case Staff = 'staff';
    case Rider = 'rider';
    case Merchant = 'merchant';
    case Customer = 'customer';
    case Provider = 'provider';

    public static function values(): array
    {
        return array_map(fn (self $r) => $r->value, self::cases());
    }
}

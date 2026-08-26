<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderProfile extends Model
{
    protected $fillable = [
        'user_id', 'is_verified', 'verified_badge_assigned_at',
        'skills', 'custom_rate_enabled', 'custom_commission_override',
        'verification_expiry',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'custom_rate_enabled' => 'boolean',
            'skills' => 'array',
            'verified_badge_assigned_at' => 'datetime',
            'verification_expiry' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
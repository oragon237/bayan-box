<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderProfile extends Model
{
    protected $fillable = [
        'user_id', 'is_verified', 'is_official', 'verified_badge_assigned_at',
        'skills', 'picture_url', 'custom_rate_enabled', 'custom_commission_override',
        'verification_expiry',
        'availability', 'hourly_rate', 'completed_jobs', 'profile_views',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'is_official' => 'boolean',
            'custom_rate_enabled' => 'boolean',
            'skills' => 'array',
            'hourly_rate' => 'decimal:2',
            'completed_jobs' => 'integer',
            'profile_views' => 'integer',
            'verified_badge_assigned_at' => 'datetime',
            'verification_expiry' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'password_hash',
        'role',
        'affiliate_code',
        'referred_by_id',
        'barangay',
        'municipality',
        'status',
    ];

    protected $hidden = ['password_hash', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function password(): string
    {
        return $this->password_hash;
    }

    public function hasRole(Role|string ...$roles): bool
    {
        foreach ($roles as $role) {
            $role = $role instanceof Role ? $role->value : $role;
            if ($this->role === $role) {
                return true;
            }
        }

        return false;
    }

    public function isAdmin(): bool
    {
        return $this->hasRole(Role::Admin);
    }

    public function referredBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(self::class, 'referred_by_id');
    }

    public function referrals(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(self::class, 'referred_by_id');
    }

    public function hub(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Hub::class, 'staff_id');
    }

    public function providerProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ProviderProfile::class);
    }

    public function wallets(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Wallet::class);
    }

    public function addresses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function loyaltyPoints(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LoyaltyPoint::class);
    }

    public function wallet(string $type): ?Wallet
    {
        return $this->wallets()->where('wallet_type', $type)->first();
    }

    public function loyaltyBalance(): int
    {
        return (int) $this->loyaltyPoints()->sum('points');
    }
}

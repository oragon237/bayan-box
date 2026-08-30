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
        'affiliate_status',
        'affiliate_documents',
        'affiliate_activated_at',
        'referred_by_id',
        'barangay',
        'municipality',
        'latitude',
        'longitude',
        'status',
        'is_official_mall',
        'verification_notes',
        'verified_at',
    ];

    protected $hidden = ['password_hash', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_official_mall' => 'boolean',
        'verified_at' => 'datetime',
        'affiliate_documents' => 'array',
        'affiliate_activated_at' => 'datetime',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    public const STATUS_PENDING = 'pending_verification';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_REJECTED = 'rejected';

    public function isMall(): bool
    {
        return $this->is_official_mall === true;
    }

    public function scopePendingMerchants(\Illuminate\Database\Eloquent\Builder $query): \Illuminate\Database\Eloquent\Builder
    {
        return $query->where('role', 'merchant')->where('status', self::STATUS_PENDING);
    }

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

    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class, 'merchant_id');
    }

    public function cartItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CartItem::class, 'customer_id');
    }

    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }

    public function deliveries(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class, 'rider_id');
    }

    public function reviews(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProductReview::class);
    }

    public function providerReviews(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ProviderReview::class, 'provider_id');
    }

    public function affiliateWallet(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Wallet::class)->where('wallet_type', Wallet::TYPE_AFFILIATE_PAYOUT);
    }

    public function notifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Notification::class);
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

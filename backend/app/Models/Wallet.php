<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    public const TYPE_RIDER_PREPAID = 'rider_prepaid';
    public const TYPE_MERCHANT_EARNINGS = 'merchant_earnings';
    public const TYPE_AFFILIATE_PAYOUT = 'affiliate_payout';
    public const TYPE_PROVIDER_EARNINGS = 'provider_earnings';
    public const TYPE_PLATFORM_EARNINGS = 'platform_earnings';
    public const TYPE_ADMIN_EARNINGS = 'admin_earnings';
    public const TYPE_SALES_ESCROW = 'sales_escrow';

    protected $fillable = [
        'user_id', 'wallet_type', 'balance', 'currency',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ledgerTransactions(): HasMany
    {
        return $this->hasMany(LedgerTransaction::class, 'wallet_id');
    }
}
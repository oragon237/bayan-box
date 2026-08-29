<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateCashOut extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PAID = 'paid';
    public const STATUS_DECLINED = 'declined';

    protected $fillable = [
        'user_id', 'wallet_type', 'amount', 'status', 'requested_at',
        'approved_at', 'approved_by', 'decline_reason',
        'payout_account_id', 'payout_reference',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'requested_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payoutAccount(): BelongsTo
    {
        return $this->belongsTo(MerchantPayoutAccount::class, 'payout_account_id');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MerchantPayoutAccount extends Model
{
    protected $fillable = [
        'user_id', 'account_type', 'account_name', 'mobile_number',
        'bank_name', 'account_number', 'branch', 'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function maskedAccount(): string
    {
        if ($this->account_type === 'bank') {
            return '•••• '.substr($this->account_number, -4);
        }
        return $this->mobile_number ? substr($this->mobile_number, 0, 4).'••••••'.substr($this->mobile_number, -2) : '—';
    }

    public function displayLabel(): string
    {
        $type = match ($this->account_type) {
            'gcash' => '💙 GCash',
            'maya' => '💚 Maya',
            'bank' => '🏦 '.($this->bank_name ?? 'Bank'),
        };
        return "{$type} — {$this->account_name} ({$this->maskedAccount()})";
    }
}
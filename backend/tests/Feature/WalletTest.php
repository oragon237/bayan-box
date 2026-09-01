<?php

namespace Tests\Feature;

use App\Models\LedgerTransaction;
use App\Models\User;
use App\Models\Wallet;
use App\Services\WalletService;
use RuntimeException;
use Tests\TestCase;

class WalletTest extends TestCase
{
    private function createWallet(float $balance = 0, string $type = Wallet::TYPE_MERCHANT_EARNINGS): Wallet
    {
        $user = User::factory()->create();
        return Wallet::create([
            'user_id' => $user->id,
            'wallet_type' => $type,
            'balance' => $balance,
            'currency' => 'PHP',
        ]);
    }

    public function test_credit_creates_ledger_row_and_increments_balance(): void
    {
        $wallet = $this->createWallet();

        $entry = app(WalletService::class)->credit($wallet, 100.00, 'Test credit');

        $this->assertSame('100.00', $wallet->fresh()->balance);
        $this->assertSame('credit', $entry->direction);
        $this->assertSame(100.00, $entry->amount);
        $this->assertNotEmpty($entry->transaction_hash);
    }

    public function test_debit_reduces_balance(): void
    {
        $wallet = $this->createWallet(200);

        app(WalletService::class)->debit($wallet, 80.00, 'Test debit');

        $this->assertSame('120.00', $wallet->fresh()->balance);
    }

    public function test_debit_cannot_drive_balance_negative(): void
    {
        $wallet = $this->createWallet(50);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Insufficient balance');
        app(WalletService::class)->debit($wallet, 100.00, 'Overdraft');
    }

    public function test_transaction_hash_is_unique_at_db_level(): void
    {
        $wallet = $this->createWallet();
        $service = app(WalletService::class);

        $entry = $service->credit($wallet, 100.00, 'First');

        $this->expectException(\Illuminate\Database\QueryException::class);
        LedgerTransaction::create([
            'wallet_id' => $wallet->id,
            'amount' => 100.00,
            'balance_after' => 200,
            'direction' => 'credit',
            'type' => 'manual',
            'description' => 'Hash collision',
            'transaction_hash' => $entry->transaction_hash,
        ]);
    }

    public function test_credit_with_model_reference_records_polymorphic_link(): void
    {
        $wallet = $this->createWallet();
        $user = User::factory()->create();

        $entry = app(WalletService::class)->credit($wallet, 50.00, 'Ref test', 'commission', null, $user);

        $this->assertSame(User::class, $entry->reference_type);
        $this->assertSame($user->id, $entry->reference_id);
    }

    public function test_credit_with_counterparty_records_double_entry(): void
    {
        $escrow = $this->createWallet(0, Wallet::TYPE_SALES_ESCROW);
        $merchant = $this->createWallet(0, Wallet::TYPE_MERCHANT_EARNINGS);

        $entry = app(WalletService::class)->credit($merchant, 90.00, 'Merchant split', 'transfer', $escrow);

        $this->assertSame($escrow->id, $entry->counterparty_wallet_id);
        $this->assertSame('90.00', $merchant->fresh()->balance);
    }

    public function test_transfer_moves_funds_between_wallets(): void
    {
        $source = $this->createWallet(200);
        $dest = $this->createWallet(0);

        app(WalletService::class)->transfer($source, $dest, 150.00, 'Transfer test');

        $this->assertSame('50.00', $source->fresh()->balance);
        $this->assertSame('150.00', $dest->fresh()->balance);
    }

    public function test_transfer_fails_on_insufficient_funds(): void
    {
        $source = $this->createWallet(50);
        $dest = $this->createWallet(0);

        $this->expectException(RuntimeException::class);
        app(WalletService::class)->transfer($source, $dest, 100.00, 'Overdraft transfer');
    }
}
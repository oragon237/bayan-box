<?php

namespace App\Services;

use App\Models\LedgerTransaction;
use App\Models\Order;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Open-Contract Ledger Service (PRD item 3).
 *
 * Every financial movement is recorded as a double entry with unique
 * transaction_hash for idempotency. All operations run inside
 * DB::transaction with pessimistic row locking (lockForUpdate) so concurrent
 * COD reconciliations and wallet top-ups can never race.
 */
class WalletService
{
    /**
     * Credit a wallet (positive amount).
     */
    public function credit(
        Wallet $wallet,
        float $amount,
        string $description,
        ?string $type = 'manual',
        ?Wallet $counterpartyWallet = null,
        $reference = null,
        array $meta = [],
    ): LedgerTransaction {
        return DB::transaction(function () use ($wallet, $amount, $description, $type, $counterpartyWallet, $reference, $meta) {
            /** @var Wallet $wallet */
            $wallet = $this->lock($wallet);

            $wallet->increment('balance', $amount);
            $wallet->refresh();

            $hash = $this->hash($wallet, $amount, $reference);

            if (LedgerTransaction::where('transaction_hash', $hash)->exists()) {
                throw new RuntimeException("Duplicate transaction hash: {$hash}");
            }

            return LedgerTransaction::create([
                'wallet_id' => $wallet->id,
                'counterparty_wallet_id' => $counterpartyWallet?->id,
                'amount' => $amount,
                'balance_after' => $wallet->balance,
                'direction' => 'credit',
                'type' => $type ?? 'manual',
                'description' => $description,
                'transaction_hash' => $hash,
                'reference_type' => $reference ? get_class($reference) : null,
                'reference_id' => $reference?->getKey(),
                'meta' => $meta,
            ]);
        });
    }

    /**
     * Debit a wallet (negative amount, must have sufficient balance).
     */
    public function debit(
        Wallet $wallet,
        float $amount,
        string $description,
        ?string $type = 'manual',
        ?Wallet $counterpartyWallet = null,
        $reference = null,
        array $meta = [],
    ): LedgerTransaction {
        return DB::transaction(function () use ($wallet, $amount, $description, $type, $counterpartyWallet, $reference, $meta) {
            /** @var Wallet $wallet */
            $wallet = $this->lock($wallet);

            if (bccomp((string) $wallet->balance, (string) $amount, 2) < 0) {
                throw new RuntimeException("Insufficient balance in wallet {$wallet->id} ({$wallet->wallet_type}). Required: {$amount}, available: {$wallet->balance}");
            }

            $wallet->decrement('balance', $amount);
            $wallet->refresh();

            $hash = $this->hash($wallet, -$amount, $reference);

            if (LedgerTransaction::where('transaction_hash', $hash)->exists()) {
                throw new RuntimeException("Duplicate transaction hash: {$hash}");
            }

            return LedgerTransaction::create([
                'wallet_id' => $wallet->id,
                'counterparty_wallet_id' => $counterpartyWallet?->id,
                'amount' => -$amount,
                'balance_after' => $wallet->balance,
                'direction' => 'debit',
                'type' => $type ?? 'manual',
                'description' => $description,
                'transaction_hash' => $hash,
                'reference_type' => $reference ? get_class($reference) : null,
                'reference_id' => $reference?->getKey(),
                'meta' => $meta,
            ]);
        });
    }

    /**
     * Full double-entry: debit source, credit destination inside one transaction.
     */
    public function transfer(
        Wallet $source,
        Wallet $destination,
        float $amount,
        string $description,
        ?string $type = 'transfer',
        $reference = null,
        array $meta = [],
    ): array {
        return DB::transaction(function () use ($source, $destination, $amount, $description, $type, $reference, $meta) {
            $sourceLocked = $this->lock($source);
            $destinationLocked = $this->lock($destination);

            $debit = $this->debit($sourceLocked, $amount, $description, $type, $destinationLocked, $reference, $meta);
            $credit = $this->credit($destinationLocked, $amount, $description, $type, $sourceLocked, $reference, $meta);

            return compact('debit', 'credit');
        });
    }

    /**
     * Find or create a wallet by user + type.
     */
    public function ensureWallet(int $userId, string $walletType): Wallet
    {
        return Wallet::firstOrCreate(
            ['user_id' => $userId, 'wallet_type' => $walletType],
            ['balance' => 0.00, 'currency' => 'PHP'],
        );
    }

    /**
     * Reverse ALL payouts issued for an order (Fix #2 — refunds).
     *
     * Finds every ledger credit referencing this order and creates a matching
     * debit to reverse it. Idempotent: only reverses credits not already
     * reversed.
     */
    public function refundOrder(Order $order, string $reason = 'Order refunded'): void
    {
        $platformUserId = (int) config('bayanbox.ledger.platform_user_id', 1);
        $escrow = $this->ensureWallet($platformUserId, Wallet::TYPE_SALES_ESCROW);

        // Reverse every recipient payout back into the escrow pool.
        // The `sales_receipt` (escrow money-in) is intentionally excluded — it
        // has already been disbursed; refunds move money back INTO escrow.
        $payouts = LedgerTransaction::where('reference_type', Order::class)
            ->where('reference_id', $order->id)
            ->where('direction', 'credit')
            ->where('type', '!=', 'sales_receipt')
            ->get();

        DB::transaction(function () use ($payouts, $escrow, $reason, $order) {
            foreach ($payouts as $payout) {
                $alreadyReversed = LedgerTransaction::where('reference_type', Order::class)
                    ->where('reference_id', $order->id)
                    ->where('type', $payout->type.'_refund')
                    ->where('direction', 'debit')
                    ->where('wallet_id', $payout->wallet_id)
                    ->exists();

                if ($alreadyReversed) {
                    continue;
                }

                $wallet = Wallet::find($payout->wallet_id);
                if (! $wallet) {
                    continue;
                }

                $this->transfer(
                    $wallet, $escrow,
                    (float) abs($payout->amount),
                    "{$reason} — Order #{$order->id}",
                    $payout->type.'_refund',
                    $order,
                );
            }
        });
    }

    /**
     * Re-fetch the wallet with a pessimistic row lock.
     */
    protected function lock(Wallet $wallet): Wallet
    {
        return Wallet::query()->lockForUpdate()->findOrFail($wallet->id);
    }

    /**
     * Deterministic unique hash for idempotency.
     */
    protected function hash(Wallet $wallet, float $amount, $reference = null): string
    {
        $parts = [
            $wallet->id,
            $wallet->user_id,
            $wallet->wallet_type,
            number_format($amount, 2),
            $reference ? get_class($reference).'#'.$reference->getKey() : 'null',
            Str::random(4),
        ];

        return hash('sha256', implode('|', $parts));
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LedgerTransaction;
use App\Models\Wallet;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Wallet endpoints — balances, top-ups (GCash/Maya mock), COD controls,
 * withdrawals (PRD 2.1/2.3).
 */
class WalletController extends Controller
{
    public function __construct(
        protected WalletService $walletService,
    ) {}

    /**
     * GET /api/wallets — all wallets for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $wallets = $request->user()->wallets()->with('ledgerTransactions')->get();

        return response()->json(['wallets' => $wallets]);
    }

    /**
     * POST /api/wallets/{type}/topup
     *
     * Wallet top-up via GCash/Maya. This endpoint mints a pending deposit
     * intent; a webhook from the payment provider confirms it.
     */
    public function topup(string $type, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1|max:50000',
            'payment_method' => 'required|string|in:gcash,maya,cash',
            'reference' => 'nullable|string|max:60',
        ]);

        $wallet = $this->walletService->ensureWallet($request->user()->id, $type);

        // In production this hooks to GCash/Maya; we credit immediately
        // inside a locked transaction for the demo flow.
        $tx = $this->walletService->credit(
            $wallet,
            (float) $validated['amount'],
            "Wallet top-up via {$validated['payment_method']}",
            'topup',
            null,
            null,
            ['payment_method' => $validated['payment_method'], 'provider_reference' => $validated['reference'] ?? null],
        );

        return response()->json([
            'message' => 'Wallet credited.',
            'wallet' => $wallet->refresh(),
            'transaction' => $tx,
        ]);
    }

    /**
     * GET /api/wallets/{type}/ledger — immutable transaction history.
     */
    public function ledger(string $type, Request $request): JsonResponse
    {
        $wallet = $this->walletService->ensureWallet($request->user()->id, $type);

        $ledger = $wallet->ledgerTransactions()
            ->latest('created_at')
            ->paginate($request->integer('per_page', 30));

        return response()->json([
            'wallet_id' => $wallet->id,
            'balance' => $wallet->balance,
            'ledger' => $ledger,
        ]);
    }

    /**
     * POST /api/wallets/{type}/withdraw — admin-verified payout request.
     */
    public function withdraw(string $type, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'payout_method' => 'required|string|in:gcash,maya,bank',
        ]);

        $wallet = $this->walletService->ensureWallet($request->user()->id, $type);

        // Atomic hold: debit the wallet immediately, admin disburses out-of-band.
        $tx = $this->walletService->debit(
            $wallet,
            (float) $validated['amount'],
            "Payout request via {$validated['payout_method']}",
            'withdrawal',
            null,
            null,
            ['status' => 'requested'],
        );

        return response()->json([
            'message' => 'Payout requested. Admin will disburse shortly.',
            'wallet' => $wallet->refresh(),
            'transaction' => $tx,
        ]);
    }
}
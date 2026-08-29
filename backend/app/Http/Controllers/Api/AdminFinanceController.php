<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCashOut;
use App\Models\LedgerTransaction;
use App\Models\Order;
use App\Models\RiderCodRemittance;
use App\Models\User;
use App\Models\Wallet;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin financial settlement overview: money collected, escrow, platform /
 * admin / merchant earnings, and rider COD reconciliation.
 */
class AdminFinanceController extends Controller
{
    public function __construct(
        protected WalletService $wallets,
    ) {}

    /**
     * GET /api/admin/finance — consolidated money-flow snapshot.
     */
    public function index(Request $request): JsonResponse
    {
        $platformUserId = (int) config('bayanbox.ledger.platform_user_id', 1);

        $escrow = $this->wallets->ensureWallet($platformUserId, Wallet::TYPE_SALES_ESCROW);
        $platform = $this->wallets->ensureWallet($platformUserId, Wallet::TYPE_PLATFORM_EARNINGS);
        $admin = $this->wallets->ensureWallet($platformUserId, Wallet::TYPE_ADMIN_EARNINGS);

        // Total collected from customers (sales receipts into escrow)
        $totalCollected = (float) LedgerTransaction::where('type', 'sales_receipt')
            ->where('direction', 'credit')
            ->sum('amount');

        $totalCollectedToday = (float) LedgerTransaction::where('type', 'sales_receipt')
            ->where('direction', 'credit')
            ->whereDate('created_at', today())
            ->sum('amount');

        // COD cash collected by riders at delivery (orders only)
        $codOrders = Order::where('payment_method', 'cod')
            ->whereIn('status', ['delivered', 'completed'])
            ->get();

        $codCollected = round($codOrders->sum(fn ($o) => (float) $o->total_amount + (float) $o->shipping_amount), 2);
        $codPending = round(Order::where('payment_method', 'cod')
            ->whereNotIn('status', ['delivered', 'completed', 'cancelled'])
            ->sum(\Illuminate\Support\Facades\DB::raw('COALESCE(total_amount,0) + COALESCE(shipping_amount,0)')), 2);

        // Rider COD reconciliation: collected vs remitted
        $riders = $this->riderCodSummary();

        // Merchant settlement: earned vs withdrawn per merchant
        $merchants = $this->merchantSettlement();

        // Platform financial KPIs
        $commissionEarned = (float) LedgerTransaction::whereIn('type', ['marketplace_commission', 'delivery_split'])
            ->where('direction', 'credit')
            ->where('wallet_id', $platform->id)
            ->sum('amount');

        $mallRevenue = (float) LedgerTransaction::where('type', 'mall_sale')
            ->where('direction', 'credit')
            ->where('wallet_id', $admin->id)
            ->sum('amount');

        $affiliatePaid = (float) LedgerTransaction::where('type', 'affiliate_commission')
            ->where('direction', 'credit')
            ->sum('amount');

        $pendingCashOuts = AffiliateCashOut::where('status', AffiliateCashOut::STATUS_PENDING)
            ->with(['user:id,name'])
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'user_name' => $c->user?->name,
                'wallet_type' => $c->wallet_type,
                'amount' => (float) $c->amount,
                'requested_at' => $c->requested_at,
            ]);

        return response()->json([
            'collected' => [
                'total' => round($totalCollected, 2),
                'today' => round($totalCollectedToday, 2),
                'cod' => $codCollected,
                'cod_pending' => $codPending,
                'gcash_maya' => round($totalCollected - $codCollected, 2),
            ],
            'wallets' => [
                'escrow' => (float) $escrow->balance,
                'platform' => (float) $platform->balance,
                'admin' => (float) $admin->balance,
                'platform_commission_earned' => round($commissionEarned, 2),
                'mall_revenue' => round($mallRevenue, 2),
                'affiliate_paid' => round($affiliatePaid, 2),
            ],
            'riders' => $riders,
            'merchants' => $merchants,
            'pending_cashouts' => $pendingCashOuts,
        ]);
    }

    /**
     * Rider COD reconciliation: what each rider collected in cash vs what
     * they have remitted to the hub, and the outstanding balance.
     *
     * @return array<int, array{id:int,name:string,phone:string,cod_collected:float,remitted:float,outstanding:float}>
     */
    protected function riderCodSummary(): array
    {
        $riders = User::where('role', 'rider')->get(['id', 'name', 'phone']);

        return $riders->map(function ($rider) {
            $collected = Order::where('rider_id', $rider->id)
                ->where('payment_method', 'cod')
                ->whereIn('status', ['delivered', 'completed'])
                ->get()
                ->sum(fn ($o) => (float) $o->total_amount + (float) $o->shipping_amount);

            $remitted = (float) RiderCodRemittance::where('rider_id', $rider->id)->sum('amount');

            return [
                'id' => $rider->id,
                'name' => $rider->name,
                'phone' => $rider->phone,
                'cod_collected' => round((float) $collected, 2),
                'remitted' => round($remitted, 2),
                'outstanding' => round((float) $collected - $remitted, 2),
            ];
        })->values()->all();
    }

    /**
     * Merchant settlement: total earned from marketplace sales vs withdrawn.
     *
     * @return array<int, array{id:int,name:string,earned:float,withdrawn:float,balance:float}>
     */
    protected function merchantSettlement(): array
    {
        $merchants = User::where('role', 'merchant')->get(['id', 'name']);

        return $merchants->map(function ($merchant) {
            $wallet = $this->wallets->ensureWallet($merchant->id, Wallet::TYPE_MERCHANT_EARNINGS);

            $earned = (float) $wallet->ledgerTransactions()
                ->where('direction', 'credit')
                ->whereIn('type', ['marketplace_sale', 'pickup_handling_fee'])
                ->sum('amount');

            $withdrawn = (float) AffiliateCashOut::where('user_id', $merchant->id)
                ->where('wallet_type', Wallet::TYPE_MERCHANT_EARNINGS)
                ->whereIn('status', ['approved', 'paid'])
                ->sum('amount');

            return [
                'id' => $merchant->id,
                'name' => $merchant->name,
                'earned' => round($earned, 2),
                'withdrawn' => round($withdrawn, 2),
                'balance' => (float) $wallet->balance,
            ];
        })->values()->all();
    }
}

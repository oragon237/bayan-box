<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCashOut;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Wallet;
use App\Services\WalletService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Merchant dashboard, reports, and wallet cash-out.
 */
class MerchantDashboardController extends Controller
{
    public function __construct(
        protected WalletService $wallets,
    ) {}

    /**
     * GET /api/merchant/dashboard — overview KPIs.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $merchant = $request->user();
        $merchantId = $merchant->id;

        $orderQuery = Order::whereHas('items', fn ($q) => $q->whereHas('product', fn ($p) => $p->where('merchant_id', $merchantId)));

        $monthStart = now()->startOfMonth();
        $revenueThisMonth = (float) (clone $orderQuery)->where('created_at', '>=', $monthStart)->sum('total_amount');
        $revenueLifetime = (float) (clone $orderQuery)->sum('total_amount');
        $unitsSold = (int) OrderItem::whereHas('product', fn ($p) => $p->where('merchant_id', $merchantId))->sum('quantity');
        $pendingOrders = (clone $orderQuery)->whereIn('status', ['paid', 'pending_payment'])->where('fulfillment_status', 'pending')->count();

        $wallet = $this->wallets->ensureWallet($merchantId, Wallet::TYPE_MERCHANT_EARNINGS);

        $pendingOrderList = (clone $orderQuery)
            ->with(['customer:id,name,phone', 'items.product:id,name'])
            ->whereIn('status', ['paid', 'pending_payment'])
            ->where('fulfillment_status', 'pending')
            ->orderByDesc('created_at')->limit(10)->get();

        $lowStock = Product::where('merchant_id', $merchantId)
            ->where('status', 'active')
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->get(['id', 'name', 'stock', 'low_stock_threshold', 'price']);

        return response()->json([
            'store' => ['name' => $merchant->name, 'status' => $merchant->status, 'verified' => $merchant->status === 'active'],
            'kpis' => [
                'revenue_this_month' => round($revenueThisMonth, 2),
                'revenue_lifetime' => round($revenueLifetime, 2),
                'pending_orders' => $pendingOrders,
                'units_sold' => $unitsSold,
                'wallet_balance' => (float) $wallet->balance,
            ],
            'pending_orders' => $pendingOrderList,
            'low_stock' => $lowStock,
        ]);
    }

    /**
     * GET /api/merchant/reports?from=&to=&sort= — analytics.
     */
    public function reports(Request $request): JsonResponse
    {
        $merchantId = $request->user()->id;
        $from = $request->input('from') ? Carbon::parse($request->input('from'))->startOfDay() : now()->startOfMonth();
        $to = $request->input('to') ? Carbon::parse($request->input('to'))->endOfDay() : now()->endOfDay();
        $sort = $request->input('sort', 'units');

        $orders = Order::whereHas('items', fn ($q) => $q->whereHas('product', fn ($p) => $p->where('merchant_id', $merchantId)))
            ->whereBetween('created_at', [$from, $to])
            ->get();

        // Daily revenue trend
        $trend = $orders->groupBy(fn ($o) => $o->created_at->toDateString())
            ->map(fn ($rows) => [
                'date' => $rows->first()->created_at->toDateString(),
                'revenue' => round($rows->sum(fn ($o) => (float) $o->total_amount), 2),
                'orders' => $rows->count(),
            ])->values()->sortBy('date')->values();

        // Best sellers
        $items = OrderItem::whereHas('order', fn ($q) => $q->whereBetween('created_at', [$from, $to]))
            ->whereHas('product', fn ($p) => $p->where('merchant_id', $merchantId))
            ->with('product:id,name,category,price,stock')
            ->get()
            ->groupBy('product_id')
            ->map(function ($rows) {
                $product = $rows->first()->product;
                $units = $rows->sum('quantity');
                $revenue = $rows->sum(fn ($r) => (float) $r->price_at_purchase * $r->quantity);

                return [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'category' => $product->category,
                    'units_sold' => $units,
                    'revenue' => round($revenue, 2),
                    'current_stock' => $product->stock,
                    'conversion_rate' => $units > 0 ? round(min(100, ($units / max(1, $units + $product->stock)) * 100), 1) : 0,
                ];
            })
            ->sortByDesc($sort === 'revenue' ? 'revenue' : 'units_sold')
            ->values();

        $wallet = $this->wallets->ensureWallet($merchantId, Wallet::TYPE_MERCHANT_EARNINGS);

        return response()->json([
            'trend' => $trend,
            'best_sellers' => $best = $items->values(),
            'summary' => [
                'orders' => $orders->count(),
                'revenue' => round($orders->sum(fn ($o) => (float) $o->total_amount), 2),
                'units' => $best->sum('units_sold'),
            ],
            'wallet' => [
                'balance' => (float) $wallet->balance,
                'history' => $wallet->ledgerTransactions()->latest()->limit(30)->get(),
                'withdrawals' => AffiliateCashOut::where('user_id', $merchantId)->where('wallet_type', 'merchant_earnings')->orderByDesc('created_at')->get(),
            ],
        ]);
    }

    /**
     * POST /api/merchant/cash-out — request wallet withdrawal (merchant earnings).
     */
    public function requestCashOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'payout_account_id' => 'required|integer|exists:merchant_payout_accounts,id',
        ]);

        $user = $request->user();
        $account = \App\Models\MerchantPayoutAccount::where('user_id', $user->id)->findOrFail($validated['payout_account_id']);

        $amount = round((float) $validated['amount'], 2);
        $wallet = $this->wallets->ensureWallet($user->id, Wallet::TYPE_MERCHANT_EARNINGS);
        $min = (float) config('bayanbox.affiliate.min_cashout', 200);

        if ($amount < $min) {
            return response()->json(['message' => "Minimum cash-out is ₱".number_format($min, 2).'.'], 422);
        }
        if ((float) $wallet->balance < $amount) {
            return response()->json(['message' => 'Insufficient wallet balance.'], 422);
        }

        $hasPending = AffiliateCashOut::where('user_id', $user->id)->where('wallet_type', 'merchant_earnings')->where('status', 'pending')->exists();
        if ($hasPending) {
            return response()->json(['message' => 'You already have a pending cash-out request.'], 422);
        }

        $cashOut = AffiliateCashOut::create([
            'user_id' => $user->id,
            'wallet_type' => 'merchant_earnings',
            'payout_account_id' => $account->id,
            'amount' => $amount,
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        return response()->json(['message' => 'Withdrawal requested. Admin will review.', 'cash_out' => $cashOut->load('payoutAccount')], 201);
    }
}
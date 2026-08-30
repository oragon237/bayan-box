<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Wallet;
use App\Services\DeliveryAssignmentService;
use App\Services\WalletService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Rider operational dashboard: active orders, earnings overview, trends,
 * and transaction history.
 */
class RiderDashboardController extends Controller
{
    public function __construct(
        protected DeliveryAssignmentService $assignments,
        protected WalletService $wallets,
    ) {}

    /**
     * GET /api/rider/dashboard — active orders, queue, and earnings cards.
     */
    public function overview(Request $request): JsonResponse
    {
        $riderId = $request->user()->id;

        // Active orders (assigned, out_for_delivery)
        $activeOrders = Order::with([
            'customer:id,name,phone',
            'items.product:id,name,merchant_id',
            'items.product.merchant:id,name,latitude,longitude,barangay,municipality',
        ])
            ->where('rider_id', $riderId)
            ->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
            ->whereIn('status', [DeliveryAssignmentService::STATUS_ASSIGNED, DeliveryAssignmentService::STATUS_OUT_FOR_DELIVERY])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'status' => $o->status,
                'status_label' => $o->status === 'assigned' ? 'New Assignment' : 'On the Way',
                'customer' => $o->customer,
                'delivery_address' => $o->delivery_address,
                'latitude' => $o->latitude,
                'longitude' => $o->longitude,
                'merchant' => $o->items?->first()?->product?->merchant,
                'items' => $o->items->map(fn ($i) => ['name' => $i->product?->name, 'quantity' => $i->quantity]),
                'total_amount' => $o->total_amount,
                'shipping_amount' => $o->shipping_amount,
                'payment_method' => $o->payment_method,
                'estimated_distance_km' => round((float) $o->shipping_amount / 10, 1), // rough: ₱10/km
                'estimated_delivery_min' => 30 + round((float) $o->shipping_amount / 2),
                'base_fee' => (float) $o->shipping_amount,
                'tip' => 0.00,
                'surge' => 0.00,
            ]);

        // Queue: next orders assigned but not yet active
        $queue = Order::with(['customer:id,name,phone', 'items.product:id,name'])
            ->where('rider_id', $riderId)
            ->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
            ->where('status', DeliveryAssignmentService::STATUS_ASSIGNED)
            ->orderBy('created_at')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'customer' => $o->customer,
                'items' => $o->items->map(fn ($i) => ['name' => $i->product?->name, 'quantity' => $i->quantity]),
                'shipping_amount' => $o->shipping_amount,
            ]);

        // Earnings cards
        $wallet = $this->wallets->ensureWallet($riderId, Wallet::TYPE_RIDER_PREPAID);
        $today = now()->startOfDay();
        $weekStart = now()->startOfWeek();

        $todayEarnings = $wallet->ledgerTransactions()
            ->where('direction', 'credit')
            ->where('type', 'delivery_split')
            ->where('created_at', '>=', $today)
            ->sum('amount');

        $weeklyEarnings = $wallet->ledgerTransactions()
            ->where('direction', 'credit')
            ->where('type', 'delivery_split')
            ->where('created_at', '>=', $weekStart)
            ->sum('amount');

        $codToday = Order::where('rider_id', $riderId)
            ->where('payment_method', 'cod')
            ->whereDate('updated_at', today())
            ->whereIn('status', ['delivered'])
            ->sum('total_amount');

        return response()->json([
            'active_orders' => $activeOrders,
            'queue' => $queue,
            'earnings' => [
                'today' => round((float) $todayEarnings, 2),
                'weekly' => round((float) $weeklyEarnings, 2),
                'wallet_balance' => (float) $wallet->balance,
                'cash_on_hand' => round((float) $codToday, 2),
            ],
        ]);
    }

    /**
     * GET /api/rider/earnings?period=weekly&from=&to=
     *   — period: daily | weekly | monthly
     *   — from / to: custom date range (overrides period)
     */
    public function earnings(Request $request): JsonResponse
    {
        $riderId = $request->user()->id;
        $wallet = $this->wallets->ensureWallet($riderId, Wallet::TYPE_RIDER_PREPAID);

        $from = $request->input('from') ? Carbon::parse($request->input('from')) : now()->startOfWeek();
        $to = $request->input('to') ? Carbon::parse($request->input('to')) : now()->endOfDay();

        $transactions = $wallet->ledgerTransactions()
            ->where('direction', 'credit')
            ->where('type', 'delivery_split')
            ->whereBetween('created_at', [$from, $to])
            ->get();

        // Per-order net earned from the ledger (85% rider share), so per-order
        // breakdown reconciles with the summary total_base.
        $earnedByOrder = $transactions
            ->where('reference_type', Order::class)
            ->groupBy('reference_id')
            ->map(fn ($rows) => round($rows->sum(fn ($r) => (float) $r->amount), 2));

        // Trend data grouped by date
        $trend = $transactions->groupBy(fn ($t) => $t->created_at->toDateString())
            ->map(fn ($rows, $date) => ['date' => $date, 'earnings' => round($rows->sum('amount'), 2)])
            ->sortBy('date')
            ->values();

        // Itemization
        $totalBase = $transactions->sum('amount');
        $totalTips = 0.00;
        $totalBonuses = 0.00;
        $totalIncentives = 0.00;
        $totalFees = 0.00;

        // Completed orders (transaction history)
        $completedOrders = Order::with('customer:id,name')
            ->where('rider_id', $riderId)
            ->where('fulfillment_type', Order::FULFILLMENT_DELIVERY)
            ->whereIn('status', ['delivered', 'completed'])
            ->whereBetween('updated_at', [$from, $to])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'customer_name' => $o->customer?->name,
                'date' => $o->updated_at->toDateTimeString(),
                'net_earned' => (float) ($earnedByOrder[$o->id] ?? round((float) $o->shipping_amount * 0.85, 2)),
                'status' => $o->status,
            ]);

        return response()->json([
            'summary' => [
                'total_base' => round($totalBase, 2),
                'total_tips' => $totalTips,
                'total_bonuses' => $totalBonuses,
                'total_incentives' => $totalIncentives,
                'total_fees' => $totalFees,
                'net_earnings' => round($totalBase + $totalTips + $totalBonuses + $totalIncentives - $totalFees, 2),
            ],
            'trend' => $trend,
            'transactions' => $completedOrders,
        ]);
    }
}
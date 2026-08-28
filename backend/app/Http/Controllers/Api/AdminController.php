<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCashOut;
use App\Models\DeliveryRateSetting;
use App\Models\Hub;
use App\Models\Order;
use App\Models\Parcel;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin panel endpoints (PRD 2.1).
 */
class AdminController extends Controller
{
    /**
     * GET /api/admin/dashboard — logistics summary.
     */
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'hubs_count' => Hub::count(),
            'active_staff' => User::where('role', 'staff')->where('status', 'active')->count(),
            'active_riders' => User::where('role', 'rider')->where('status', 'active')->count(),
            'parcels_today' => Parcel::whereDate('created_at', today())->count(),
            'parcels_by_status' => Parcel::selectRaw("status, count(*) as count")
                ->groupBy('status')
                ->pluck('count', 'status'),
            'pending_deliveries' => Parcel::whereIn('status', ['received_at_hub', 'out_for_delivery'])->count(),
            'avg_delivery_fee' => Parcel::where('calculated_delivery_fee', '>', 0)->avg('calculated_delivery_fee'),
        ]);
    }

    /**
     * GET /api/admin/overview — comprehensive system overview (Task 2).
     */
    public function overview(): JsonResponse
    {
        $orders = Order::whereIn('status', ['paid', 'pending_payment', 'assigned', 'out_for_delivery', 'delivered', 'completed'])->get();

        $totalRevenue = (float) $orders->sum(fn ($o) => (float) $o->total_amount + (float) $o->shipping_amount);
        $totalOrders = $orders->count();
        $gmv = (float) $orders->sum('total_amount');
        $aov = $totalOrders > 0 ? round($gmv / $totalOrders, 2) : 0;

        $orderStatus = Order::selectRaw("status, count(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status');

        $lowStock = Product::where('status', 'active')->where('stock', '<=', 5)->count();
        $activeListings = Product::where('status', 'active')->count();
        $pointsItems = Product::where('points_only', true)->where('stock', '>', 0)->count();

        $pendingCashOuts = AffiliateCashOut::where('status', AffiliateCashOut::STATUS_PENDING)->count();
        $affiliateCommissions = \App\Models\LedgerTransaction::where('type', 'affiliate_commission')
            ->where('direction', 'credit')
            ->sum('amount');

        return response()->json([
            'financial' => [
                'total_revenue' => round($totalRevenue, 2),
                'gmv' => round($gmv, 2),
                'total_orders' => $totalOrders,
                'average_order_value' => $aov,
            ],
            'users' => [
                'customers' => User::where('role', 'customer')->where('status', 'active')->count(),
                'merchants' => User::where('role', 'merchant')->where('status', 'active')->count(),
                'riders' => User::where('role', 'rider')->where('status', 'active')->count(),
                'providers' => User::where('role', 'provider')->where('status', 'active')->count(),
                'affiliates' => User::whereNotNull('affiliate_code')->count(),
                'pending_merchants' => User::where('role', 'merchant')->where('status', 'pending_verification')->count(),
            ],
            'affiliate' => [
                'commissions_distributed' => round((float) $affiliateCommissions, 2),
                'pending_cashouts' => $pendingCashOuts,
            ],
            'orders' => [
                'status_breakdown' => $orderStatus,
                'in_transit' => (int) Order::whereIn('status', ['assigned', 'out_for_delivery'])->count(),
                'delivered' => (int) Order::whereIn('status', ['delivered', 'completed'])->count(),
            ],
            'mall' => [
                'active_listings' => $activeListings,
                'low_stock' => $lowStock,
                'points_items' => $pointsItems,
            ],
        ]);
    }

    /**
     * GET /api/admin/delivery-rate-settings
     */
    public function rateSettings(): JsonResponse
    {
        return response()->json(DeliveryRateSetting::orderBy('municipality_name')->get());
    }

    /**
     * PUT /api/admin/delivery-rate-settings/{id}
     */
    public function updateRateSetting(int $id, Request $request): JsonResponse
    {
        $setting = DeliveryRateSetting::findOrFail($id);

        $validated = $request->validate([
            'base_fare' => 'nullable|numeric|min:0',
            'base_distance_km' => 'nullable|numeric|min:0.1',
            'per_km_rate' => 'nullable|numeric|min:0',
            'platform_percentage' => 'nullable|numeric|between:0,100',
            'rider_percentage' => 'nullable|numeric|between:0,100',
            'surge_multiplier' => 'nullable|numeric|min:1',
            'surge_override_active' => 'nullable|boolean',
        ]);

        $setting->update($validated);

        return response()->json($setting);
    }

    /**
     * POST /api/admin/hubs — accredit a new hub.
     */
    public function createHub(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'address' => 'required|string',
            'barangay' => 'nullable|string|max:100',
            'municipality' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'staff_id' => 'nullable|exists:users,id',
            'capacity_limit' => 'nullable|integer|min:1',
        ]);

        $hub = Hub::create($validated);

        // Auto-assign referral code
        $hub->referral_code ??= strtoupper(substr(preg_replace('/[^A-Z0-9]/', '', $hub->name), 0, 4)).$hub->id;
        $hub->save();

        return response()->json($hub, 201);
    }

    /**
     * GET /api/admin/users — list users by role.
     */
    public function users(Request $request): JsonResponse
    {
        return response()->json(
            User::when($request->input('role'), fn ($q, $r) => $q->where('role', $r))
                ->orderByDesc('created_at')
                ->paginate($request->integer('per_page', 30))
        );
    }
}
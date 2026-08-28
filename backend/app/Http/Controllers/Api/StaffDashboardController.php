<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCashOut;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * Staff dashboard with "Things to Do" counts.
 */
class StaffDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'pending_merchant_approvals' => User::where('role', 'merchant')->where('status', 'pending_verification')->count(),
            'pending_cashouts' => AffiliateCashOut::where('status', AffiliateCashOut::STATUS_PENDING)->count(),
            'disputed_orders' => Order::where('status', 'disputed')->count(),
            'low_stock_items' => Product::where('status', 'active')->where('stock', '<=', 5)->count(),
        ]);
    }
}
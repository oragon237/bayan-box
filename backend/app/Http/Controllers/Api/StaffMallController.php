<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff inventory visibility for BeCoolBox Mall (Module 2).
 *
 * Hub staff can view stock levels of all official mall products, reserve
 * items for local hub inventory, and process local over-the-counter pickups.
 */
class StaffMallController extends Controller
{
    /**
     * GET /api/staff/mall/inventory — full mall catalogue with stock.
     */
    public function inventory(Request $request): JsonResponse
    {
        return response()->json(
            Product::officialMall()
                ->select(['id', 'name', 'description', 'price', 'stock', 'suki_points_award', 'image_url', 'category', 'status', 'created_at'])
                ->orderByDesc('status')
                ->latest()
                ->paginate($request->integer('per_page', 50))
        );
    }
}
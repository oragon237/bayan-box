<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff inventory visibility for Bayan Mall (Module 2).
 *
 * Hub staff can view stock levels of all official mall products, reserve
 * items for local hub inventory, and process local over-the-counter pickups.
 */
class StaffMallController extends Controller
{
    /**
     * POST /api/staff/mall/products — staff publish an official Mall item.
     * Mall products stay owned by the platform account, not an individual
     * staff profile, so customers always see one official HABI Mall store.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0|lt:price',
            'stock' => 'required|integer|min:0',
            'suki_points_award' => 'nullable|integer|min:0|max:10000',
            'affiliate_percentage' => 'nullable|numeric|between:0,50',
            'image_url' => 'nullable|string|max:255',
            'gallery' => 'nullable|array',
            'gallery.*.image_url' => 'required|string|max:255',
            'category' => 'nullable|string|max:50',
            'availability' => 'nullable|in:available,out_of_stock,unavailable',
        ]);

        $product = Product::create(array_merge(collect($validated)->except('gallery')->toArray(), [
            'merchant_id' => (int) config('bayanbox.ledger.platform_user_id', 1),
            'is_official_mall' => true,
            'status' => 'active',
            'availability' => $validated['availability'] ?? 'available',
        ]));

        foreach (array_values($validated['gallery'] ?? []) as $index => $image) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $image['image_url'],
                'sort_order' => $index,
            ]);
        }

        return response()->json($product->load('images'), 201);
    }

    /**
     * GET /api/staff/mall/inventory — full mall catalogue with stock.
     */
    public function inventory(Request $request): JsonResponse
    {
        return response()->json(
            Product::officialMall()
                ->with('images:id,product_id,image_url,sort_order')
                ->select(['id', 'name', 'description', 'price', 'stock', 'suki_points_award', 'image_url', 'category', 'status', 'availability', 'created_at'])
                ->orderByDesc('status')
                ->latest()
                ->paginate($request->integer('per_page', 50))
        );
    }
}

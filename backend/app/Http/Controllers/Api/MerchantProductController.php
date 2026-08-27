<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Merchant product catalog (FR-MKT-001..003).
 *
 * Merchants list, edit, and archive their own physical products with
 * per-product Suki Points awards and custom affiliate referral percentages.
 */
class MerchantProductController extends Controller
{
    /**
     * GET /api/merchant/products — my listed products.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Product::where('merchant_id', $request->user()->id)
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }

    /**
     * POST /api/merchant/products — upload a new product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'suki_points_award' => 'nullable|integer|min:0|max:10000',
            'affiliate_percentage' => ['nullable', 'numeric', 'between:0,'.config('bayanbox.marketplace.max_affiliate_percentage', 50)],
            'image_url' => 'nullable|url|max:255',
            'category' => 'nullable|string|max:50',
        ]);

        $product = Product::create(array_merge($validated, [
            'merchant_id' => $request->user()->id,
            'status' => 'active',
        ]));

        return response()->json($product, 201);
    }

    /**
     * PUT /api/merchant/products/{id} — update one of my products.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $product = Product::where('merchant_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:150',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
            'suki_points_award' => 'sometimes|integer|min:0|max:10000',
            'affiliate_percentage' => ['sometimes', 'numeric', 'between:0,'.config('bayanbox.marketplace.max_affiliate_percentage', 50)],
            'image_url' => 'nullable|url|max:255',
            'category' => 'sometimes|string|max:50',
            'status' => 'sometimes|in:active,archived',
        ]);

        $product->update($validated);

        return response()->json($product);
    }

    /**
     * DELETE /api/merchant/products/{id} — archive a product.
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $product = Product::where('merchant_id', $request->user()->id)->findOrFail($id);
        $product->update(['status' => 'archived']);

        return response()->json(['message' => 'Product archived.']);
    }
}
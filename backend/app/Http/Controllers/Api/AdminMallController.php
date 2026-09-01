<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * HABI Mall CRUD (Module 2).
 *
 * Admin manages the official flagship store's products (wholesale packaging
 * supplies, official provincial goods, bulk thermal paper, mailers).
 * These products carry the `is_official_mall` badge, are pinned to the top
 * of the storefront, and route 100% to admin_earnings on checkout.
 */
class AdminMallController extends Controller
{
    /**
     * GET /api/admin/mall/products — list all mall products.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Product::officialMall()
                ->with(['merchant:id,name', 'images:id,product_id,image_url,sort_order'])
                ->latest()
                ->paginate($request->integer('per_page', 30))
        );
    }

    /**
     * POST /api/admin/mall/products — create a mall product.
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

        $this->syncGallery($product, $validated['gallery'] ?? []);

        return response()->json($product->load('images'), 201);
    }

    /**
     * PUT /api/admin/mall/products/{id} — update a mall product.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $product = Product::officialMall()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:150',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0|lt:price',
            'stock' => 'sometimes|integer|min:0',
            'suki_points_award' => 'sometimes|integer|min:0|max:10000',
            'affiliate_percentage' => 'sometimes|numeric|between:0,50',
            'image_url' => 'nullable|string|max:255',
            'gallery' => 'nullable|array',
            'gallery.*.image_url' => 'required|string|max:255',
            'category' => 'sometimes|string|max:50',
            'status' => 'sometimes|in:active,archived',
            'availability' => 'sometimes|in:available,out_of_stock,unavailable',
        ]);

        $product->update(collect($validated)->except('gallery')->toArray());

        if (array_key_exists('gallery', $validated)) {
            $this->syncGallery($product, $validated['gallery']);
        }

        return response()->json($product->load('images'));
    }

    /**
     * DELETE /api/admin/mall/products/{id} — archive a mall product.
     */
    public function destroy(int $id): JsonResponse
    {
        $product = Product::officialMall()->findOrFail($id);
        $product->update(['status' => 'archived']);

        return response()->json(['message' => 'Mall product archived.']);
    }

    /**
     * Replace a product's gallery with the provided ordered image list.
     */
    protected function syncGallery(Product $product, array $gallery): void
    {
        $product->images()->delete();

        foreach (array_values($gallery) as $i => $image) {
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $image['image_url'],
                'sort_order' => $i,
            ]);
        }
    }
}

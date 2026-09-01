<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
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
                ->with('images:id,product_id,image_url,sort_order')
                ->latest()
                ->paginate($request->integer('per_page', 20))
        );
    }

    /**
     * POST /api/merchant/products — upload a new product.
     */
    public function store(Request $request): JsonResponse
    {
        $this->assertVerifiedMerchant($request->user());

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'unit' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0|lt:price',
            'stock' => 'required|integer|min:0',
            'low_stock_threshold' => 'nullable|integer|min:1|max:1000',
            'suki_points_award' => 'nullable|integer|min:0|max:10000',
            'affiliate_percentage' => ['nullable', 'numeric', 'between:0,'.config('bayanbox.marketplace.max_affiliate_percentage', 50)],
            'image_url' => 'nullable|string|max:255',
            'gallery' => 'nullable|array',
            'gallery.*.image_url' => 'required|string|max:255',
            'category' => 'nullable|string|max:50',
            'availability' => 'nullable|in:available,out_of_stock,unavailable',
            'status' => 'nullable|in:active,draft,archived',
        ]);

        $product = Product::create(array_merge($validated, [
            'merchant_id' => $request->user()->id,
            'status' => 'active',
        ]));

        $this->syncGallery($product, $validated['gallery'] ?? []);

        return response()->json($product->load('images'), 201);
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
            'sale_price' => 'nullable|numeric|min:0|lt:price',
            'stock' => 'sometimes|integer|min:0',
            'suki_points_award' => 'sometimes|integer|min:0|max:10000',
            'affiliate_percentage' => ['sometimes', 'numeric', 'between:0,'.config('bayanbox.marketplace.max_affiliate_percentage', 50)],
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
     * DELETE /api/merchant/products/{id} — archive a product.
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $product = Product::where('merchant_id', $request->user()->id)->findOrFail($id);
        $product->update(['status' => 'archived']);

        return response()->json(['message' => 'Product archived.']);
    }

    /**
     * Module 1: Only verified (active) merchants may list public products.
     */
    protected function assertVerifiedMerchant($user): void
    {
        if ($user->role === 'merchant' && $user->status !== User::STATUS_ACTIVE) {
            abort(403, 'Merchant account is not yet verified. Approval required.');
        }
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

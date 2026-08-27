<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Services\RelatedProductsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Unified homepage storefront (FR-MKT-004).
 *
 * Public-ish catalog of all active, in-stock merchant products, searchable
 * and filterable by category.
 */
class MarketplaceController extends Controller
{
    /**
     * GET /api/products — active storefront grid.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            Product::active()
                ->with(['merchant:id,name', 'images:id,product_id,image_url'])
                ->withCount('reviews')
                ->withAvg('reviews', 'rating')
                ->when($request->input('category'), fn ($q, $c) => $q->where('category', $c))
                ->when($request->input('q'), fn ($q, $s) => $q->where('name', 'ilike', "%{$s}%"))
                ->orderByDesc('is_official_mall') // BeCoolBox Mall pinned to top
                ->latest()
                ->paginate($request->integer('per_page', 24))
        );
    }

    /**
     * GET /api/products/categories — distinct categories for filter chips.
     */
    public function categories(): JsonResponse
    {
        return response()->json(
            Product::active()->distinct()->orderBy('category')->pluck('category')
        );
    }

    /**
     * GET /api/products/{id} — single product detail with ratings & reviews.
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $product = Product::with([
            'merchant:id,name',
            'reviews.user:id,name',
            'images:id,product_id,image_url',
        ])->findOrFail($id);

        // Item 1: record the view for behavioral related products
        app(RelatedProductsService::class)->recordView($request->user()?->id, $id);

        $average = round((float) $product->reviews->avg('rating'), 2);
        $product->setAttribute('average_rating', $average);
        $product->setAttribute('review_count', $product->reviews->count());
        $product->setAttribute('can_review', $this->canReview($request->user(), $id));

        return response()->json(['data' => $product]);
    }

    /**
     * GET /api/products/{id}/related — behavioral related products (item 1).
     */
    public function related(int $id, Request $request): JsonResponse
    {
        $product = Product::findOrFail($id);

        $related = app(RelatedProductsService::class)->for($product, $request->user()?->id);

        return response()->json(['related' => $related]);
    }

    /**
     * A user can review when they have a paid/completed order for the product
     * and have not yet written a review (Module 4 — verified buyers only).
     */
    protected function canReview($user, int $productId): bool
    {
        if (! $user) {
            return false;
        }

        if (ProductReview::where('user_id', $user->id)->where('product_id', $productId)->exists()) {
            return false;
        }

        return OrderItem::where('product_id', $productId)
            ->whereHas('order', fn ($q) => $q
                ->where('customer_id', $user->id)
                ->whereIn('status', ['paid', 'completed'])
            )
            ->exists();
    }
}
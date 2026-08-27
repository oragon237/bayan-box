<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Product reviews & ratings (Module 4).
 *
 * Only verified buyers (users with a paid/completed order containing the
 * product) can leave a review. One review per (user, product).
 */
class ProductReviewController extends Controller
{
    /**
     * GET /api/products/{id}/reviews — list reviews for a product.
     */
    public function index(int $productId): JsonResponse
    {
        Product::findOrFail($productId);

        $reviews = ProductReview::with('user:id,name')
            ->where('product_id', $productId)
            ->latest()
            ->paginate(20);

        return response()->json($reviews);
    }

    /**
     * POST /api/products/{id}/review — submit a review (verified buyer only).
     */
    public function store(Request $request, int $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);
        $user = $request->user();

        // Verify that the user has purchased this product (paid/completed order)
        $orderItem = OrderItem::where('product_id', $productId)
            ->whereHas('order', fn ($q) => $q
                ->where('customer_id', $user->id)
                ->whereIn('status', ['paid', 'completed'])
            )
            ->first();

        if (! $orderItem) {
            return response()->json([
                'message' => 'Only verified buyers can review this product.',
            ], 403);
        }

        // Enforce one review per (user, product) — upsert replaces previous
        $validated = $request->validate([
            'rating' => 'required|integer|between:1,5',
            'review' => 'nullable|string|max:1000',
        ]);

        $review = ProductReview::updateOrCreate(
            ['user_id' => $user->id, 'product_id' => $productId],
            [
                'rating' => $validated['rating'],
                'review' => $validated['review'] ?? null,
                'order_item_id' => $orderItem->id,
            ],
        );

        return response()->json($review, 201);
    }
}
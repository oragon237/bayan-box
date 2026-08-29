<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Merchant storefront: profile, stats, filterable catalog, and store reviews.
 */
class MerchantStoreController extends Controller
{
    /**
     * GET /api/merchants/{id}/store — merchant profile + stats + products.
     */
    public function store(int $id, Request $request): JsonResponse
    {
        $merchant = User::withCount('products')
            ->with(['providerProfile'])
            ->where('role', 'merchant')
            ->findOrFail($id);

        // Overall rating from product reviews across the merchant's catalog
        $productIds = Product::where('merchant_id', $id)->where('status', 'active')->pluck('id');
        $rating = ProductReview::whereIn('product_id', $productIds)->avg('rating');
        $reviewCount = ProductReview::whereIn('product_id', $productIds)->count();
        $unitsSold = OrderItem::whereHas('product', fn ($q) => $q->where('merchant_id', $id))->sum('quantity');

        $productsQuery = Product::where('merchant_id', $id)
            ->where('status', 'active')
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->with('images:id,product_id,image_url');

        // In-store search
        if ($q = trim((string) $request->input('q'))) {
            $productsQuery->where(function ($qry) use ($q) {
                $qry->where('name', 'ilike', "%{$q}%")
                    ->orWhere('description', 'ilike', "%{$q}%");
            });
        }

        // Category filter
        if ($cat = $request->input('category')) {
            $productsQuery->where('category', $cat);
        }

        // Price range
        if ($request->filled('min_price')) {
            $productsQuery->where('price', '>=', (float) $request->input('min_price'));
        }
        if ($request->filled('max_price')) {
            $productsQuery->where('price', '<=', (float) $request->input('max_price'));
        }

        // Min rating (filter by average review rating)
        if ($request->filled('min_rating')) {
            $productsQuery->havingRaw('COALESCE(AVG(reviews.rating), 0) >= ?', [(float) $request->input('min_rating')])
                ->leftJoin('product_reviews as reviews', 'reviews.product_id', '=', 'products.id')
                ->groupBy('products.id');
        }

        // In-stock only
        if ($request->boolean('in_stock')) {
            $productsQuery->where('stock', '>', 0)->where('availability', 'available');
        }

        // Sort
        switch ($request->input('sort')) {
            case 'best_sellers':
                $productsQuery->withSum('orderItems as units_sold', 'quantity')->orderByDesc('units_sold');
                break;
            case 'newest':
                $productsQuery->latest();
                break;
            case 'on_sale':
                $productsQuery->whereNotNull('sale_price')->whereColumn('sale_price', '<', 'price');
                break;
            default:
                $productsQuery->latest();
        }

        $categories = Product::where('merchant_id', $id)
            ->where('status', 'active')
            ->distinct()->orderBy('category')->pluck('category');

        $products = $productsQuery->paginate($request->integer('per_page', 20));

        return response()->json([
            'merchant' => [
                'id' => $merchant->id,
                'name' => $merchant->name,
                'verified' => $merchant->status === 'active',
                'barangay' => $merchant->barangay,
                'municipality' => $merchant->municipality,
                'joined_at' => $merchant->created_at,
                'is_official_mall' => $merchant->is_official_mall,
                'banner_url' => null,
                'logo_url' => $merchant->providerProfile?->picture_url,
            ],
            'stats' => [
                'rating' => round((float) $rating, 1),
                'review_count' => $reviewCount,
                'product_count' => $products->total(),
                'units_sold' => $unitsSold,
                'response_time' => '~2h',
                'fulfillment_rate' => 98,
            ],
            'categories' => $categories,
            'products' => $products,
        ]);
    }

    /**
     * GET /api/merchants/{id}/reviews — store reviews (merchant's product reviews).
     */
    public function reviews(int $id): JsonResponse
    {
        User::where('role', 'merchant')->findOrFail($id);

        $reviews = ProductReview::with(['user:id,name', 'product:id,name'])
            ->whereHas('product', fn ($q) => $q->where('merchant_id', $id))
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($reviews);
    }
}
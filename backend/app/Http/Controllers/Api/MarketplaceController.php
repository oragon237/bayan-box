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
     * GET /api/products — active storefront grid with search/filter/sort.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::active()
            ->with(['merchant:id,name,barangay,municipality', 'images:id,product_id,image_url'])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating');

        // Extended search: name, description, or merchant/store name
        if ($q = trim((string) $request->input('q'))) {
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'ilike', "%{$q}%")
                    ->orWhere('description', 'ilike', "%{$q}%")
                    ->orWhereHas('merchant', fn ($m) => $m->where('name', 'ilike', "%{$q}%"));
            });
        }

        // Category filter
        if ($request->input('category')) {
            $query->where('category', $request->input('category'));
        }

        // Location filters (merchant's city / barangay)
        if ($city = $request->input('city')) {
            $query->whereHas('merchant', fn ($m) => $m->where('municipality', 'ilike', "%{$city}%"));
        }
        if ($barangay = $request->input('barangay')) {
            $query->whereHas('merchant', fn ($m) => $m->where('barangay', 'ilike', "%{$barangay}%"));
        }

        // On-sale filter: only products with an active discount price
        if ($request->boolean('on_sale')) {
            $query->whereNotNull('sale_price')->whereColumn('sale_price', '<', 'price');
        }

        // Points-only filter
        if ($request->boolean('points_only')) {
            $query->where('points_only', true);
        }

        // Sorting
        switch ($request->input('sort')) {
            case 'reviews':
                $query->orderByDesc('reviews_count');
                break;
            case 'sales':
                $query->withSum('orderItems as units_sold', 'quantity')->orderByDesc('units_sold');
                break;
            case 'price_asc':
                $query->orderBy('price');
                break;
            case 'price_desc':
                $query->orderByDesc('price');
                break;
            default:
                $query->orderByDesc('is_official_mall')->latest();
        }

        $paginator = $query->paginate($request->integer('per_page', 24));

        // Ad injection: tag sponsored products + provide featured/sponsored sets
        $activeAds = \App\Models\AdCampaign::active()
            ->whereIn('ad_type', ['sponsored', 'homepage_featured', 'flash_deal'])
            ->with('product:id,name,image_url,price,sale_price,stock,merchant_id')
            ->get();

        $sponsoredIds = $activeAds->where('ad_type', 'sponsored')->pluck('product_id');
        $featuredCampaigns = $activeAds->where('ad_type', 'homepage_featured')->values();
        $flashIds = $activeAds->where('ad_type', 'flash_deal')->pluck('product_id');

        // Sponsored items matching the query/category (for the search "Sponsored Items" row)
        $queryTerm = trim((string) $request->input('q'));
        $catTerm = $request->input('category');
        $cityTerm = $request->input('city');
        $sponsored = $activeAds->where('ad_type', 'sponsored')->map(function ($ad) use ($queryTerm, $catTerm, $cityTerm) {
            $product = $ad->product;
            $match = false;
            if ($queryTerm) {
                $match = stripos($product->name, $queryTerm) !== false
                    || stripos((string) $product->description, $queryTerm) !== false;
            }
            if (! $match && $catTerm) {
                $match = $product->category === $catTerm;
            }
            // Fallback: any active sponsored ad
            return ['matched' => $match || $cityTerm, 'ad' => $ad];
        });

        // Prefer matches; fall back to any sponsored ads (up to 3)
        $sponsoredItems = $sponsored->sortByDesc('matched')->take(3)->map(fn ($s) => [
            'campaign_id' => $s['ad']->id,
            'product' => $s['ad']->product,
            'ad_type' => $s['ad']->ad_type,
        ])->values();

        // Attach ad campaign info to each product in the page
        $campaignByProduct = $activeAds->keyBy('product_id');
        $paginator->getCollection()->transform(function ($product) use ($campaignByProduct, $sponsoredIds, $flashIds) {
            $product->setAttribute('is_sponsored', $sponsoredIds->contains($product->id));
            $product->setAttribute('is_flash_deal', $flashIds->contains($product->id));
            if ($campaign = $campaignByProduct->get($product->id)) {
                $product->setAttribute('ad_campaign_id', $campaign->id);
            }
            return $product;
        });

        // Sponsored products first
        $sorted = $paginator->getCollection()->sortByDesc(fn ($p) => (int) $p->is_sponsored)->values();
        $paginator->setCollection($sorted);

        $response = $paginator->toArray();
        $response['featured_campaigns'] = $featuredCampaigns->map(fn ($c) => [
            'id' => $c->id,
            'product' => $c->product,
            'daily_rate' => $c->daily_rate,
        ]);
        $response['sponsored_items'] = $sponsoredItems;

        return response()->json($response);
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
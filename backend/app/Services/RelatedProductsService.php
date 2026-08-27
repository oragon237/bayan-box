<?php

namespace App\Services;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductView;
use Illuminate\Database\Eloquent\Collection;

/**
 * Behavioral related products (item 1).
 *
 * Ranks products by:
 *  1. Purchase co-occurrence — customers who bought the current product
 *     also bought these.
 *  2. View co-occurrence — users who viewed the current product also viewed
 *     these (captures search→browse behavior).
 *  3. Same-category fallback — always includes category peers.
 */
class RelatedProductsService
{
    /**
     * Record a product view (user can be null for anonymous).
     */
    public function recordView(?int $userId, int $productId): void
    {
        // Throttle: only record if this user hasn't viewed recently (6h)
        $recent = ProductView::where('product_id', $productId)
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->where('viewed_at', '>', now()->subHours(6))
            ->exists();

        if ($recent) {
            return;
        }

        ProductView::create([
            'user_id' => $userId,
            'product_id' => $productId,
            'viewed_at' => now(),
        ]);
    }

    /**
     * Related products for the given product.
     */
    public function for(Product $product, ?int $userId = null, int $limit = 6): Collection
    {
        $scores = [];

        // 1. Purchase co-occurrence
        $buyerIds = \App\Models\Order::whereIn('status', ['paid', 'completed', 'assigned', 'out_for_delivery', 'delivered', 'pending_payment'])
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->pluck('customer_id')
            ->unique()
            ->values()
            ->all();

        if ($buyerIds) {
            $coBought = OrderItem::whereHas('order', fn ($q) => $q->whereIn('customer_id', $buyerIds))
                ->where('product_id', '!=', $product->id)
                ->get()
                ->groupBy('product_id');

            foreach ($coBought as $pid => $items) {
                $scores[$pid] = ($scores[$pid] ?? 0) + $items->count() * 3;
            }
        }

        // 2. View co-occurrence
        $viewerIds = ProductView::where('product_id', $product->id)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->unique()
            ->all();

        if ($viewerIds) {
            $alsoViewed = ProductView::whereIn('user_id', $viewerIds)
                ->where('product_id', '!=', $product->id)
                ->get()
                ->groupBy('product_id');

            foreach ($alsoViewed as $pid => $views) {
                $scores[$pid] = ($scores[$pid] ?? 0) + $views->count();
            }
        }

        // 3. Same-category boost
        $sameCategoryIds = Product::active()
            ->where('category', $product->category)
            ->where('id', '!=', $product->id)
            ->pluck('id');

        foreach ($sameCategoryIds as $pid) {
            $scores[$pid] = ($scores[$pid] ?? 0) + 1;
        }

        // Sort by score descending, take top N, then load products
        arsort($scores);
        $ids = array_slice(array_keys($scores), 0, $limit);

        if (empty($ids)) {
            return new Collection();
        }

        return Product::active()
            ->with(['merchant:id,name', 'images:id,product_id,image_url'])
            ->whereIn('id', $ids)
            ->get()
            ->sortBy(fn ($p) => array_search($p->id, $ids))
            ->values();
    }
}
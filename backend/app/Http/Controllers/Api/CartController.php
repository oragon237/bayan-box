<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Unified shopping cart (FR-MKT-005).
 *
 * Multi-merchant cart keyed by (customer_id, product_id). The frontend keeps
 * a local mirror and syncs it here before checkout.
 */
class CartController extends Controller
{
    /** Add a single item without replacing the rest of the cart. */
    public function add(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1|max:100',
        ]);
        return \Illuminate\Support\Facades\DB::transaction(function () use ($request, $data) {
            // Serialize simultaneous additions, including the first insert for a product.
            \App\Models\User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $product = \App\Models\Product::active()->whereKey($data['product_id'])->lockForUpdate()->first();
            if (! $product) {
                return response()->json(['message' => 'This product is no longer available.'], 422);
            }
            $item = CartItem::firstOrNew(['customer_id' => $request->user()->id, 'product_id' => $product->id]);
            $quantity = ($item->exists ? $item->quantity : 0) + $data['quantity'];
            if ($quantity > min(100, $product->stock)) {
                return response()->json(['message' => 'The requested quantity exceeds available stock or the 100-item limit.'], 422);
            }
            $item->quantity = $quantity;
            $item->save();
            return response()->json(['message' => 'Added to cart.', 'item' => $item]);
        });
    }

    /**
     * GET /api/cart — current customer cart.
     */
    public function index(Request $request): JsonResponse
    {
        $items = CartItem::with('product.merchant:id,name,latitude,longitude')
            ->where('customer_id', $request->user()->id)
            ->get()->map(function ($item) {
                $data = $item->toArray();
                // Attach merchant coordinates for the delivery-distance origin
                $data['merchant'] = $item->product?->merchant
                    ? ['id' => $item->product->merchant->id, 'name' => $item->product->merchant->name, 'latitude' => $item->product->merchant->latitude, 'longitude' => $item->product->merchant->longitude]
                    : null;
                return $data;
            });

        return response()->json([
            'items' => $items,
            'count' => $items->count(),
        ]);
    }

    /**
     * POST /api/cart/sync — upsert cart rows from the PWA.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cart' => 'required|array',
            'cart.*.product_id' => 'required|integer|exists:products,id',
            'cart.*.quantity' => 'required|integer|min:1|max:100',
        ]);

        // Authoritative sync: remove any cart rows absent from the payload so
        // items the shopper removed in the UI are never charged at checkout.
        $productIds = collect($validated['cart'])->pluck('product_id');
        CartItem::where('customer_id', $request->user()->id)
            ->whereNotIn('product_id', $productIds)
            ->delete();

        foreach ($validated['cart'] as $row) {
            CartItem::updateOrCreate(
                ['customer_id' => $request->user()->id, 'product_id' => $row['product_id']],
                ['quantity' => $row['quantity']],
            );
        }

        return response()->json(['message' => 'Cart synced.']);
    }

    /**
     * DELETE /api/cart/items/{productId} — remove a line item.
     */
    public function remove(int $productId, Request $request): JsonResponse
    {
        CartItem::where('customer_id', $request->user()->id)
            ->where('product_id', $productId)
            ->delete();

        return response()->json(['message' => 'Removed from cart.']);
    }
}

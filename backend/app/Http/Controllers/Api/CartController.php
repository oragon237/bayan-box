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
    /**
     * GET /api/cart — current customer cart.
     */
    public function index(Request $request): JsonResponse
    {
        $items = CartItem::with('product')->where('customer_id', $request->user()->id)->get();

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
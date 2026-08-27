<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
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
                ->with('merchant:id,name')
                ->when($request->input('category'), fn ($q, $c) => $q->where('category', $c))
                ->when($request->input('q'), fn ($q, $s) => $q->where('name', 'ilike', "%{$s}%"))
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
}
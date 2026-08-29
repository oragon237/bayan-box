<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\SystemSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Admin settings: fees/rates, ad pricing, toggles, locations, categories.
 */
class AdminSettingsController extends Controller
{
    public function __construct(
        protected SystemSettingService $settings,
    ) {}

    /**
     * GET /api/admin/settings — all settings + categories.
     */
    public function index(): JsonResponse
    {
        $categories = Category::orderBy('sort_order')->get()->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'icon' => $c->icon,
            'sort_order' => $c->sort_order,
            'is_active' => $c->is_active,
            'product_count' => $c->productsCount(),
        ]);

        return response()->json([
            'settings' => $this->settings->all(),
            'categories' => $categories,
        ]);
    }

    /**
     * PUT /api/admin/settings — save settings groups.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fees' => 'sometimes|array',
            'ads' => 'sometimes|array',
            'toggles' => 'sometimes|array',
            'locations' => 'sometimes|array',
        ]);

        $this->settings->setAll($validated);

        return response()->json(['message' => 'Settings saved.', 'settings' => $this->settings->all()]);
    }

    /**
     * POST /api/admin/categories — create a category.
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'icon' => 'nullable|string|max:10',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);
        $validated['icon'] = $validated['icon'] ?? '📦';

        if (Category::where('slug', $validated['slug'])->exists()) {
            return response()->json(['message' => 'Category already exists.'], 422);
        }

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    /**
     * PUT /api/admin/categories/{id} — update a category.
     */
    public function updateCategory(int $id, Request $request): JsonResponse
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:50',
            'icon' => 'nullable|string|max:10',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json($category);
    }

    /**
     * DELETE /api/admin/categories/{id} — delete a category.
     * Safety: cannot delete a category with active products.
     */
    public function destroyCategory(int $id): JsonResponse
    {
        $category = Category::findOrFail($id);

        $activeProducts = Product::where('category', $category->name)->where('status', 'active')->count();
        if ($activeProducts > 0) {
            return response()->json([
                'message' => "Cannot delete \"{$category->name}\" — {$activeProducts} active product(s) are using it.",
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }
}
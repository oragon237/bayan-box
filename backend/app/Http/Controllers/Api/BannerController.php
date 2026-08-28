<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin-managed marketplace banners (CRUD) + public listing.
 */
class BannerController extends Controller
{
    /**
     * GET /api/banners — public active banners, sorted by order.
     */
    public function index(): JsonResponse
    {
        return response()->json(Banner::active()->get());
    }

    /**
     * GET /api/admin/banners — list all banners (admin).
     */
    public function adminIndex(): JsonResponse
    {
        return response()->json(Banner::orderBy('sort_order')->get());
    }

    /**
     * POST /api/admin/banners — create a banner.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:120',
            'image_url' => 'required|string|max:255',
            'link_url' => 'nullable|string|max:255',
            'link_type' => 'nullable|in:internal,external',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $banner = Banner::create($validated);

        return response()->json($banner, 201);
    }

    /**
     * PUT /api/admin/banners/{id} — update a banner.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $banner = Banner::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:120',
            'image_url' => 'sometimes|string|max:255',
            'link_url' => 'nullable|string|max:255',
            'link_type' => 'nullable|in:internal,external',
            'sort_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ]);

        $banner->update($validated);

        return response()->json($banner);
    }

    /**
     * DELETE /api/admin/banners/{id} — delete a banner.
     */
    public function destroy(int $id): JsonResponse
    {
        Banner::findOrFail($id)->delete();

        return response()->json(['message' => 'Banner deleted.']);
    }
}
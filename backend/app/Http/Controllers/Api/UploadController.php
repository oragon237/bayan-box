<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ImageUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Image upload endpoint (Phase A).
 *
 * Accepts a multipart "image" file, optimizes it (resize + compress), and
 * returns the public URL.
 */
class UploadController extends Controller
{
    public function __construct(
        protected ImageUploadService $images,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,gif,webp,bmp|max:8192',
            'folder' => 'nullable|string|max:30',
        ]);

        $url = $this->images->optimize($request->file('image'), $request->input('folder', 'products'));

        return response()->json(['image_url' => $url]);
    }
}
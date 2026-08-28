<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdCampaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Ad impression / click / conversion tracking (public, throttled).
 */
class AdTrackingController extends Controller
{
    /**
     * POST /api/ads/{id}/impression — increment impression count.
     */
    public function impression(int $id): JsonResponse
    {
        AdCampaign::where('id', $id)->increment('impressions');

        return response()->json(['ok' => true]);
    }

    /**
     * POST /api/ads/{id}/click — increment click count.
     */
    public function click(int $id): JsonResponse
    {
        AdCampaign::where('id', $id)->increment('clicks');

        return response()->json(['ok' => true]);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdCampaign;
use App\Models\Product;
use App\Services\AdService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Merchant ad campaign management.
 */
class MerchantAdController extends Controller
{
    public function __construct(
        protected AdService $ads,
    ) {}

    /**
     * GET /api/merchant/ads — my campaigns with analytics.
     */
    public function index(Request $request): JsonResponse
    {
        $campaigns = AdCampaign::with('product:id,name,image_url,price')
            ->where('merchant_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($c) => $this->shape($c));

        return response()->json(['campaigns' => $campaigns]);
    }

    /**
     * GET /api/merchant/ads/rates — available ad types + daily rates.
     */
    public function rates(): JsonResponse
    {
        $types = [
            ['type' => 'sponsored', 'label' => 'Top Placement / Sponsored Search', 'daily_rate' => $this->ads->rate('sponsored')],
            ['type' => 'homepage_featured', 'label' => 'Homepage Featured Carousel', 'daily_rate' => $this->ads->rate('homepage_featured')],
            ['type' => 'flash_deal', 'label' => 'Flash Deal / On Sale Booster', 'daily_rate' => $this->ads->rate('flash_deal')],
        ];

        return response()->json(['rates' => $types]);
    }

    /**
     * POST /api/merchant/ads — launch an ad campaign.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'ad_type' => 'required|in:sponsored,homepage_featured,flash_deal',
            'duration_days' => 'required|integer|min:1|max:'.config('bayanbox.ads.max_duration_days', 30),
            'payment_method' => 'required|in:wallet,points',
        ]);

        $product = Product::where('merchant_id', $request->user()->id)->findOrFail($validated['product_id']);

        $campaign = $this->ads->launch(
            $request->user(),
            $product,
            $validated['ad_type'],
            $validated['duration_days'],
            $validated['payment_method'],
        );

        return response()->json(['message' => 'Ad campaign launched!', 'campaign' => $this->shape($campaign->load('product:id,name,image_url,price'))], 201);
    }

    /**
     * POST /api/merchant/ads/{id}/pause — pause or resume a campaign.
     */
    public function togglePause(int $id, Request $request): JsonResponse
    {
        $campaign = AdCampaign::where('merchant_id', $request->user()->id)->findOrFail($id);

        $campaign->update(['status' => $campaign->status === 'paused' ? 'active' : 'paused']);

        return response()->json(['message' => $campaign->status === 'paused' ? 'Campaign paused.' : 'Campaign resumed.', 'campaign' => $this->shape($campaign->fresh('product:id,name,image_url,price'))]);
    }

    protected function shape(AdCampaign $c): array
    {
        return [
            'id' => $c->id,
            'product' => $c->product,
            'ad_type' => $c->ad_type,
            'daily_rate' => $c->daily_rate,
            'duration_days' => $c->duration_days,
            'total_cost' => $c->total_cost,
            'start_date' => $c->start_date,
            'end_date' => $c->end_date,
            'status' => $c->status,
            'payment_method' => $c->payment_method,
            'impressions' => $c->impressions,
            'clicks' => $c->clicks,
            'conversions' => $c->conversions,
            'days_remaining' => max(0, $c->end_date->diffInDays(now(), false)),
        ];
    }
}
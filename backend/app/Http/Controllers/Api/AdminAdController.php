<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdCampaign;
use App\Models\Banner;
use App\Models\User;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin ad oversight: product ads + home slide ads, with edit/delete/toggle.
 */
class AdminAdController extends Controller
{
    public function __construct(
        protected WalletService $wallets,
    ) {}

    /**
     * GET /api/admin/ads?type=product|home_slide — list campaigns/banners.
     */
    public function index(Request $request): JsonResponse
    {
        $type = $request->input('type', 'product');

        if ($type === 'home_slide') {
            $banners = Banner::orderBy('sort_order')->get();

            $active = $banners->where('is_active', true)->count();
            $paused = $banners->where('is_active', false)->count();

            return response()->json([
                'data' => $banners->map(fn ($b) => [
                    'id' => $b->id,
                    'type' => 'home_slide',
                    'title' => $b->title,
                    'image_url' => $b->image_url,
                    'link_url' => $b->link_url,
                    'link_type' => $b->link_type,
                    'display_order' => $b->sort_order,
                    'status' => $b->is_active ? 'active' : 'paused',
                    'start_date' => $b->created_at,
                    'end_date' => null,
                    'impressions' => 0,
                    'clicks' => 0,
                ]),
                'total' => $banners->count(),
                'active' => $active,
                'paused' => $paused,
                'expired' => 0,
            ]);
        }

        // Product ads (ad campaigns)
        $query = AdCampaign::with(['product:id,name,image_url,price', 'merchant:id,name']);

        if ($request->input('status')) {
            $query->where('status', $request->input('status'));
        }

        $campaigns = $query->orderByDesc('created_at')->get();

        return response()->json([
            'data' => $campaigns->map(fn ($c) => [
                'id' => $c->id,
                'type' => 'product',
                'title' => $c->title ?? $c->product?->name ?? "Campaign #{$c->id}",
                'product' => $c->product,
                'merchant' => $c->merchant,
                'ad_type' => $c->ad_type,
                'daily_rate' => $c->daily_rate,
                'total_cost' => $c->total_cost,
                'display_order' => $c->display_order,
                'keywords' => $c->keywords,
                'start_date' => $c->start_date,
                'end_date' => $c->end_date,
                'status' => $c->status,
                'payment_method' => $c->payment_method,
                'impressions' => $c->impressions,
                'clicks' => $c->clicks,
                'conversions' => $c->conversions,
            ]),
            'total' => $campaigns->count(),
            'active' => $campaigns->where('status', 'active')->count(),
            'paused' => $campaigns->where('status', 'paused')->count(),
            'expired' => $campaigns->whereIn('status', ['completed'])->count(),
        ]);
    }

    /**
     * PUT /api/admin/ads/{id} — update a product ad or home slide ad.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $type = $request->input('type', 'product');

        if ($type === 'home_slide') {
            $banner = Banner::findOrFail($id);
            $banner->update($request->only(['title', 'image_url', 'link_url', 'link_type', 'sort_order', 'is_active']));

            return response()->json(['message' => 'Home slide ad updated.', 'ad' => $banner->fresh()]);
        }

        $campaign = AdCampaign::findOrFail($id);
        $campaign->update($request->only(['title', 'ad_type', 'status', 'display_order', 'keywords', 'start_date', 'end_date', 'daily_rate']));

        return response()->json(['message' => 'Ad campaign updated.', 'ad' => $campaign->fresh(['product:id,name,image_url,price'])]);
    }

    /**
     * DELETE /api/admin/ads/{id} — delete a product ad or home slide ad.
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $type = $request->input('type', 'product');

        if ($type === 'home_slide') {
            Banner::findOrFail($id)->delete();
        } else {
            AdCampaign::findOrFail($id)->delete();
        }

        return response()->json(['message' => 'Ad deleted.']);
    }

    /**
     * PUT /api/admin/ads/{id}/status — pause / stop a product campaign.
     */
    public function setStatus(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:active,paused,completed',
        ]);

        $campaign = AdCampaign::findOrFail($id);
        $campaign->update(['status' => $validated['status']]);

        return response()->json(['message' => 'Campaign status updated.', 'campaign' => $campaign->fresh()]);
    }

    /**
     * PUT /api/admin/ad-rates — update daily rates per ad type.
     */
    public function updateRates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sponsored' => 'required|numeric|min:0',
            'homepage_featured' => 'required|numeric|min:0',
            'flash_deal' => 'required|numeric|min:0',
        ]);

        config(['bayanbox.ads.rates.sponsored' => (float) $validated['sponsored']]);
        config(['bayanbox.ads.rates.homepage_featured' => (float) $validated['homepage_featured']]);
        config(['bayanbox.ads.rates.flash_deal' => (float) $validated['flash_deal']]);

        return response()->json(['message' => 'Ad rates updated (session).', 'rates' => config('bayanbox.ads.rates')]);
    }

    /**
     * POST /api/admin/merchants/{id}/grant-credits — grant ad credits.
     */
    public function grantCredits(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $merchant = User::where('role', 'merchant')->findOrFail($id);
        $wallet = $this->wallets->ensureWallet($merchant->id, 'merchant_earnings');
        $this->wallets->credit($wallet, (float) $validated['amount'], 'Free promotional credits granted', 'admin_grant');

        return response()->json(['message' => "Granted ₱{$validated['amount']} ad credits to {$merchant->name}."]);
    }
}
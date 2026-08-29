<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ProviderProfile;
use App\Models\ProviderReview;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Provider (skilled worker) profile, skills, picture, and reviews (item 7).
 */
class ProviderController extends Controller
{
    /**
     * GET /api/providers — searchable, filterable, sortable provider directory.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'provider')
            ->where('status', 'active')
            ->with('providerProfile')
            ->withCount('providerReviews')
            ->withAvg('providerReviews', 'rating');

        // Keyword search (name or skills)
        if ($q = trim((string) $request->input('q'))) {
            $query->where(function ($qry) use ($q) {
                $qry->where('name', 'ilike', "%{$q}%")
                    ->orWhereHas('providerProfile', fn ($pp) => $pp->whereJsonContains('skills', $q));
            });
        }

        // Skill filter
        if ($skill = $request->input('skill')) {
            $query->whereHas('providerProfile', fn ($pp) => $pp->whereJsonContains('skills', $skill));
        }

        // Availability filter
        if ($availability = $request->input('availability')) {
            $query->whereHas('providerProfile', fn ($pp) => $pp->where('availability', $availability));
        }

        // Location filter (municipality match)
        if ($location = $request->input('location')) {
            $query->where('municipality', 'ilike', "%{$location}%");
        }

        // Sort
        switch ($request->input('sort')) {
            case 'top_rated':
                $query->orderByDesc('provider_reviews_avg_rating');
                break;
            case 'top_viewed':
                $query->orderByDesc(ProviderProfile::select('profile_views')->whereColumn('provider_profiles.user_id', 'users.id'));
                break;
            case 'lowest_rate':
                $query->orderBy(ProviderProfile::select('hourly_rate')->whereColumn('provider_profiles.user_id', 'users.id'));
                break;
            case 'closest':
                $query->orderBy('municipality');
                break;
            default:
                $query->orderByDesc('provider_reviews_avg_rating');
        }

        $providers = $query->paginate($request->integer('per_page', 12))
            ->withQueryString();

        $providers->getCollection()->transform(fn ($p) => $this->shapeProvider($p));

        return response()->json($providers);
    }

    /**
     * GET /api/providers/{id} — provider detail with reviews (tracks a view).
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $provider = User::where('role', 'provider')
            ->with(['providerProfile', 'providerReviews.customer:id,name'])
            ->withCount('providerReviews')
            ->withAvg('providerReviews', 'rating')
            ->findOrFail($id);

        // Track a profile view for the "Top Viewed" sort
        if ($provider->providerProfile) {
            $provider->providerProfile->increment('profile_views');
        }

        return response()->json(['provider' => $this->shapeProvider($provider)]);
    }

    /**
     * GET /api/provider/profile — my provider profile.
     */
    public function myProfile(Request $request): JsonResponse
    {
        $provider = $request->user()->load('providerProfile');

        $profile = ProviderProfile::firstOrCreate(['user_id' => $provider->id]);

        return response()->json([
            'provider' => $this->shapeProvider($provider),
            'profile' => $profile,
        ]);
    }

    /**
     * PUT /api/provider/profile — update skills, picture, custom rate flag.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:50',
            'picture_url' => 'nullable|string|max:255',
            'custom_rate_enabled' => 'nullable|boolean',
        ]);

        $profile = ProviderProfile::firstOrCreate(['user_id' => $request->user()->id]);
        $profile->update($validated);

        return response()->json(['profile' => $profile->fresh()]);
    }

    /**
     * GET /api/providers/{id}/reviews — list a provider's reviews.
     */
    public function reviews(int $id): JsonResponse
    {
        User::where('role', 'provider')->findOrFail($id);

        return response()->json(
            ProviderReview::with('customer:id,name')
                ->where('provider_id', $id)
                ->latest()
                ->paginate(20)
        );
    }

    /**
     * POST /api/providers/{id}/review — review a provider you hired (completed).
     */
    public function review(int $id, Request $request): JsonResponse
    {
        User::where('role', 'provider')->findOrFail($id);
        $customer = $request->user();

        $booking = Booking::where('provider_id', $id)
            ->where('customer_id', $customer->id)
            ->where('status', 'completed')
            ->latest()
            ->first();

        if (! $booking) {
            return response()->json([
                'message' => 'Only customers with a completed booking can review this worker.',
            ], 403);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|between:1,5',
            'review' => 'nullable|string|max:1000',
        ]);

        $review = ProviderReview::updateOrCreate(
            ['customer_id' => $customer->id, 'provider_id' => $id],
            [
                'rating' => $validated['rating'],
                'review' => $validated['review'] ?? null,
                'booking_id' => $booking->id,
            ],
        );

        // Item 9: encourage reviews by awarding the customer Suki points
        if ($review->wasRecentlyCreated) {
            app(\App\Services\LoyaltyService::class)->award(
                $customer,
                (int) config('bayanbox.rewards.review_points', 5),
                'review_reward',
                'Thanks for reviewing a provider! +points',
                $review,
            );
        }

        return response()->json($review, 201);
    }

    /**
     * Shape a provider for JSON (skills, picture, badges, rating).
     */
    protected function shapeProvider(User $provider): array
    {
        $profile = $provider->providerProfile;

        return [
            'id' => $provider->id,
            'name' => $provider->name,
            'phone' => $provider->phone,
            'municipality' => $provider->municipality,
            'is_verified' => (bool) ($profile?->is_verified ?? false),
            'is_official' => (bool) ($profile?->is_official ?? false),
            'picture_url' => $profile?->picture_url,
            'skills' => $profile?->skills ?? [],
            'availability' => $profile?->availability ?? 'available_now',
            'hourly_rate' => $profile?->hourly_rate,
            'completed_jobs' => $profile?->completed_jobs ?? 0,
            'profile_views' => $profile?->profile_views ?? 0,
            'average_rating' => round((float) $provider->provider_reviews_avg_rating, 2),
            'review_count' => (int) $provider->provider_reviews_count,
        ];
    }
}
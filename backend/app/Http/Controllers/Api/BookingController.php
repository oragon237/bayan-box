<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Models\Wallet;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Skilled-worker bookings (PRD 2.6).
 */
class BookingController extends Controller
{
    public function __construct(
        protected WalletService $walletService,
    ) {}

    /**
     * GET /api/services — public service catalogue with rates (hire flow).
     */
    public function services(): JsonResponse
    {
        return response()->json(ServiceCategory::orderBy('name')->get());
    }

    /**
     * GET /api/bookings — list bookings for the authenticated user
     * (customer or provider).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $bookings = Booking::when($user->role === 'provider', fn ($q) => $q->where('provider_id', $user->id))
            ->when($user->role === 'customer', fn ($q) => $q->where('customer_id', $user->id))
            ->with(['service:id,name', 'customer:id,name,phone', 'provider:id,name,phone'])
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json($bookings);
    }

    /**
     * POST /api/bookings — customer creates a booking (hire a provider).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:service_categories,id',
            'provider_id' => 'nullable|integer|exists:users,id',
            'booking_date' => 'required|date|after:now',
            'address' => 'required|string',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        if (! empty($validated['provider_id'])) {
            $provider = User::where('id', $validated['provider_id'])->where('role', 'provider')->first();
            if (! $provider) {
                return response()->json(['message' => 'Provider not found.'], 404);
            }
        }

        $service = ServiceCategory::findOrFail($validated['service_id']);
        $commissionPct = $service->global_commission_percentage / 100;

        $quoted = $service->base_pakyaw_rate;
        $commission = round($quoted * $commissionPct, 2);
        $payout = $quoted - $commission;

        $booking = Booking::create([
            'customer_id' => $request->user()->id,
            'provider_id' => $validated['provider_id'] ?? null,
            'service_id' => $service->id,
            'booking_date' => $validated['booking_date'],
            'address' => $validated['address'],
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'quoted_amount' => $quoted,
            'platform_commission' => $commission,
            'provider_payout' => $payout,
            'status' => 'pending',
        ]);

        return response()->json($booking->load(['service:id,name', 'provider:id,name']), 201);
    }

    /**
     * POST /api/bookings/{id}/accept — provider accepts a job.
     */
    public function accept(int $id, Request $request): JsonResponse
    {
        $booking = Booking::where('provider_id', $request->user()->id)->findOrFail($id);
        $booking->update(['status' => 'accepted']);

        return response()->json($booking);
    }

    /**
     * POST /api/bookings/{id}/complete — provider marks done; escrow payout.
     */
    public function complete(int $id, Request $request): JsonResponse
    {
        $booking = Booking::where('provider_id', $request->user()->id)->findOrFail($id);

        $booking->update(['status' => 'completed']);

        // Credit provider earnings
        $wallet = $this->walletService->ensureWallet($request->user()->id, Wallet::TYPE_PROVIDER_EARNINGS);
        $this->walletService->credit(
            $wallet,
            (float) $booking->provider_payout,
            "Service payout — {$booking->service?->name}",
            'escrow_release',
            null,
            $booking,
        );

        return response()->json([
            'booking' => $booking->fresh(),
            'payout' => $booking->provider_payout,
        ]);
    }
}
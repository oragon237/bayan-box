<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeliveryRateSetting;
use App\Models\Hub;
use App\Models\Parcel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin panel endpoints (PRD 2.1).
 */
class AdminController extends Controller
{
    /**
     * GET /api/admin/dashboard — logistics summary.
     */
    public function dashboard(): JsonResponse
    {
        return response()->json([
            'hubs_count' => Hub::count(),
            'active_staff' => User::where('role', 'staff')->where('status', 'active')->count(),
            'active_riders' => User::where('role', 'rider')->where('status', 'active')->count(),
            'parcels_today' => Parcel::whereDate('created_at', today())->count(),
            'parcels_by_status' => Parcel::selectRaw("status, count(*) as count")
                ->groupBy('status')
                ->pluck('count', 'status'),
            'pending_deliveries' => Parcel::whereIn('status', ['received_at_hub', 'out_for_delivery'])->count(),
            'avg_delivery_fee' => Parcel::where('calculated_delivery_fee', '>', 0)->avg('calculated_delivery_fee'),
        ]);
    }

    /**
     * GET /api/admin/delivery-rate-settings
     */
    public function rateSettings(): JsonResponse
    {
        return response()->json(DeliveryRateSetting::orderBy('municipality_name')->get());
    }

    /**
     * PUT /api/admin/delivery-rate-settings/{id}
     */
    public function updateRateSetting(int $id, Request $request): JsonResponse
    {
        $setting = DeliveryRateSetting::findOrFail($id);

        $validated = $request->validate([
            'base_fare' => 'nullable|numeric|min:0',
            'base_distance_km' => 'nullable|numeric|min:0.1',
            'per_km_rate' => 'nullable|numeric|min:0',
            'platform_percentage' => 'nullable|numeric|between:0,100',
            'rider_percentage' => 'nullable|numeric|between:0,100',
            'surge_multiplier' => 'nullable|numeric|min:1',
            'surge_override_active' => 'nullable|boolean',
        ]);

        $setting->update($validated);

        return response()->json($setting);
    }

    /**
     * POST /api/admin/hubs — accredit a new hub.
     */
    public function createHub(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'address' => 'required|string',
            'barangay' => 'nullable|string|max:100',
            'municipality' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'staff_id' => 'nullable|exists:users,id',
            'capacity_limit' => 'nullable|integer|min:1',
        ]);

        $hub = Hub::create($validated);

        // Auto-assign referral code
        $hub->referral_code ??= strtoupper(substr(preg_replace('/[^A-Z0-9]/', '', $hub->name), 0, 4)).$hub->id;
        $hub->save();

        return response()->json($hub, 201);
    }

    /**
     * GET /api/admin/users — list users by role.
     */
    public function users(Request $request): JsonResponse
    {
        return response()->json(
            User::when($request->input('role'), fn ($q, $r) => $q->where('role', $r))
                ->orderByDesc('created_at')
                ->paginate($request->integer('per_page', 30))
        );
    }
}
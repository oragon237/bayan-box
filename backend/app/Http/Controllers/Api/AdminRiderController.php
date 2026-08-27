<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Admin rider management (item 5).
 *
 * Admin can list riders with details, view a single rider, update their
 * profile/status, and deactivate (soft delete) them.
 */
class AdminRiderController extends Controller
{
    /**
     * GET /api/admin/riders — list all riders.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            User::where('role', 'rider')
                ->select(['id', 'name', 'phone', 'email', 'municipality', 'status', 'created_at', 'verified_at'])
                ->withCount(['deliveries as active_deliveries' => fn ($q) => $q->whereIn('status', ['assigned', 'out_for_delivery'])])
                ->orderByDesc('created_at')
                ->paginate($request->integer('per_page', 30))
        );
    }

    /**
     * GET /api/admin/riders/{id} — view a single rider.
     */
    public function show(int $id): JsonResponse
    {
        $rider = User::where('role', 'rider')->withCount('deliveries')->findOrFail($id);

        return response()->json([
            'rider' => $rider->only(['id', 'name', 'phone', 'email', 'municipality', 'status', 'created_at', 'verified_at']),
            'total_deliveries' => $rider->deliveries_count,
        ]);
    }

    /**
     * PUT /api/admin/riders/{id} — update rider profile/status.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $rider = User::where('role', 'rider')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'email' => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($rider->id)],
            'municipality' => 'sometimes|nullable|string|max:100',
            'status' => 'sometimes|in:active,inactive,deactivated',
        ]);

        $rider->update($validated);

        return response()->json($rider->only(['id', 'name', 'phone', 'email', 'municipality', 'status']));
    }

    /**
     * DELETE /api/admin/riders/{id} — deactivate a rider.
     */
    public function destroy(int $id): JsonResponse
    {
        $rider = User::where('role', 'rider')->findOrFail($id);
        $rider->update(['status' => 'deactivated']);

        return response()->json(['message' => 'Rider deactivated.']);
    }
}
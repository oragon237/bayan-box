<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Shared profile endpoint for customer / rider / provider accounts.
 *
 * Allows editing the user's name, email, address (barangay / municipality),
 * and fixed location coordinates (latitude / longitude). The longitude is
 * always required with latitude so a partial coordinate is never saved.
 */
class ProfileController extends Controller
{
    /**
     * GET /api/profile — my editable profile fields.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'role' => $user->role,
                'barangay' => $user->barangay,
                'municipality' => $user->municipality,
                'latitude' => $user->latitude !== null ? (float) $user->latitude : null,
                'longitude' => $user->longitude !== null ? (float) $user->longitude : null,
                'status' => $user->status,
            ],
        ]);
    }

    /**
     * PUT /api/profile — update my profile fields.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'nullable|string|max:100',
            'email' => ['nullable', 'string', 'email', 'max:100', Rule::unique('users', 'email')->ignore($user->id)],
            'barangay' => 'nullable|string|max:100',
            'municipality' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-14,21',
            'longitude' => 'nullable|numeric|between:116,127',
        ]);

        // Coordinates must come as a pair — a lone latitude/longitude is a
        // save error, not a half-updated profile.
        $latGiven = array_key_exists('latitude', $validated);
        $lngGiven = array_key_exists('longitude', $validated);
        if ($latGiven !== $lngGiven) {
            return response()->json([
                'message' => 'Latitude and longitude must be provided together.',
            ], 422);
        }

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
            'barangay' => $validated['barangay'] ?? $user->barangay,
            'municipality' => $validated['municipality'] ?? $user->municipality,
            'latitude' => $latGiven ? $validated['latitude'] : $user->latitude,
            'longitude' => $lngGiven ? $validated['longitude'] : $user->longitude,
        ]);

        return response()->json([
            'message' => 'Profile updated.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'phone' => $user->phone,
                'email' => $user->email,
                'role' => $user->role,
                'barangay' => $user->barangay,
                'municipality' => $user->municipality,
                'latitude' => $user->latitude !== null ? (float) $user->latitude : null,
                'longitude' => $user->longitude !== null ? (float) $user->longitude : null,
                'status' => $user->status,
            ],
        ]);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Merchant profile & verification documents (item 8).
 *
 * Merchants manage their merchant photo, DTI/SEC registration number,
 * government ID, business permit, verification message, and address.
 */
class MerchantProfileController extends Controller
{
    /**
     * GET /api/merchant/profile — current merchant profile + documents.
     */
    public function show(Request $request): JsonResponse
    {
        $merchant = $request->user();
        $docs = $this->parseDocs($merchant);

        return response()->json([
            'merchant' => [
                'id' => $merchant->id,
                'name' => $merchant->name,
                'phone' => $merchant->phone,
                'email' => $merchant->email,
                'barangay' => $merchant->barangay,
                'municipality' => $merchant->municipality,
                'latitude' => $merchant->latitude !== null ? (float) $merchant->latitude : null,
                'longitude' => $merchant->longitude !== null ? (float) $merchant->longitude : null,
                'status' => $merchant->status,
            ],
            'documents' => $docs,
        ]);
    }

    /**
     * PUT /api/merchant/profile — update store info, address + verification docs.
     */
    public function update(Request $request): JsonResponse
    {
        $merchant = $request->user();

        $validated = $request->validate([
            'name' => 'nullable|string|max:100',
            'email' => ['nullable', 'string', 'email', 'max:100', \Illuminate\Validation\Rule::unique('users', 'email')->ignore($merchant->id)],
            'barangay' => 'nullable|string|max:100',
            'municipality' => 'nullable|string|max:100',
            'address' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric|between:-14,21',
            'longitude' => 'nullable|numeric|between:116,127',
            'dti_sec_number' => 'nullable|string|max:50',
            'government_id_url' => 'nullable|string|max:255',
            'business_permit_url' => 'nullable|string|max:255',
            'picture_url' => 'nullable|string|max:255',
            'verification_message' => 'nullable|string|max:500',
        ]);

        // Coordinates must come as a pair — reject a lone latitude/longitude.
        $latGiven = array_key_exists('latitude', $validated);
        $lngGiven = array_key_exists('longitude', $validated);
        if ($latGiven !== $lngGiven) {
            return response()->json([
                'message' => 'Latitude and longitude must be provided together.',
            ], 422);
        }

        // Persist docs into verification_notes JSON (merge with existing)
        $existing = $this->parseDocs($merchant);
        $docs = array_merge($existing, [
            'dti_sec_number' => $validated['dti_sec_number'] ?? $existing['dti_sec_number'],
            'government_id_url' => $validated['government_id_url'] ?? $existing['government_id_url'],
            'business_permit_url' => $validated['business_permit_url'] ?? $existing['business_permit_url'],
            'picture_url' => $validated['picture_url'] ?? $existing['picture_url'],
            'verification_message' => $validated['verification_message'] ?? $existing['verification_message'],
        ]);

        $merchant->update([
            'name' => $validated['name'] ?? $merchant->name,
            'email' => $validated['email'] ?? $merchant->email,
            'barangay' => $validated['barangay'] ?? $merchant->barangay,
            'municipality' => $validated['municipality'] ?? $merchant->municipality,
            'latitude' => $latGiven ? $validated['latitude'] : $merchant->latitude,
            'longitude' => $lngGiven ? $validated['longitude'] : $merchant->longitude,
            'verification_notes' => json_encode($docs),
        ]);

        return response()->json([
            'message' => 'Profile updated.',
            'merchant' => [
                'id' => $merchant->id,
                'name' => $merchant->name,
                'phone' => $merchant->phone,
                'email' => $merchant->email,
                'barangay' => $merchant->barangay,
                'municipality' => $merchant->municipality,
                'latitude' => $merchant->latitude !== null ? (float) $merchant->latitude : null,
                'longitude' => $merchant->longitude !== null ? (float) $merchant->longitude : null,
                'status' => $merchant->status,
            ],
            'documents' => $docs,
        ]);
    }

    /**
     * Parse the verification_notes JSON into a normalized documents array.
     */
    protected function parseDocs(User $merchant): array
    {
        $raw = $merchant->verification_notes;
        $decoded = $raw ? (json_decode($raw, true) ?: []) : [];

        return [
            'dti_sec_number' => $decoded['dti_sec_number'] ?? null,
            'government_id_url' => $decoded['government_id_url'] ?? null,
            'business_permit_url' => $decoded['business_permit_url'] ?? null,
            'picture_url' => $decoded['picture_url'] ?? null,
            'verification_message' => $decoded['verification_message'] ?? null,
            'submitted_at' => $decoded['submitted_at'] ?? $merchant->created_at?->toIso8601String(),
        ];
    }
}
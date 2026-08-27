<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Services\SmsService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Admin merchant verification workflow (Module 1).
 *
 * New merchants register as `pending_verification`. Admin approves or rejects
 * via these endpoints, which flip status, provision the merchant wallet, and
 * fire a Semaphore SMS notification.
 */
class AdminMerchantController extends Controller
{
    public function __construct(
        protected WalletService $wallets,
        protected SmsService $sms,
    ) {}

    /**
     * GET /api/admin/merchants — list all merchants (item 5).
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json(
            User::where('role', 'merchant')
                ->select(['id', 'name', 'phone', 'email', 'barangay', 'municipality', 'status', 'verification_notes', 'verified_at', 'created_at'])
                ->orderByDesc('created_at')
                ->paginate($request->integer('per_page', 30))
        );
    }

    /**
     * GET /api/admin/merchants/{id} — view a single merchant with documents.
     */
    public function show(int $id): JsonResponse
    {
        $merchant = User::where('role', 'merchant')
            ->withCount('products')
            ->findOrFail($id);

        $docs = [];
        if ($merchant->verification_notes) {
            $docs = json_decode($merchant->verification_notes, true) ?: [];
        }

        return response()->json([
            'merchant' => $merchant->only(['id', 'name', 'phone', 'email', 'barangay', 'municipality', 'status', 'verification_notes', 'verified_at', 'created_at']),
            'documents' => [
                'dti_sec_number' => $docs['dti_sec_number'] ?? null,
                'government_id_url' => $docs['government_id_url'] ?? null,
                'business_permit_url' => $docs['business_permit_url'] ?? null,
                'picture_url' => $docs['picture_url'] ?? null,
                'verification_message' => $docs['verification_message'] ?? null,
                'submitted_at' => $docs['submitted_at'] ?? null,
            ],
            'product_count' => $merchant->products_count,
        ]);
    }

    /**
     * PUT /api/admin/merchants/{id} — update merchant profile/details.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $merchant = User::where('role', 'merchant')->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'email' => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($merchant->id)],
            'municipality' => 'sometimes|nullable|string|max:100',
            'status' => 'sometimes|in:active,inactive,deactivated,pending_verification,rejected',
        ]);

        $merchant->update($validated);

        return response()->json($merchant->only(['id', 'name', 'phone', 'email', 'municipality', 'status']));
    }

    /**
     * DELETE /api/admin/merchants/{id} — deactivate a merchant.
     */
    public function destroy(int $id): JsonResponse
    {
        $merchant = User::where('role', 'merchant')->findOrFail($id);
        $merchant->update(['status' => 'deactivated']);

        return response()->json(['message' => 'Merchant deactivated.']);
    }

    /**
     * POST /api/admin/merchants/{id}/activate — reactivate a merchant.
     */
    public function activate(int $id): JsonResponse
    {
        $merchant = User::where('role', 'merchant')->findOrFail($id);
        $merchant->update([
            'status' => User::STATUS_ACTIVE,
            'verified_at' => $merchant->verified_at ?? now(),
        ]);

        return response()->json(['message' => 'Merchant activated.', 'merchant' => $merchant->only(['id', 'name', 'status'])]);
    }

    /**
     * POST /api/admin/merchants/{id}/deactivate — pause a merchant.
     */
    public function deactivate(int $id): JsonResponse
    {
        $merchant = User::where('role', 'merchant')->findOrFail($id);
        $merchant->update(['status' => 'deactivated']);

        return response()->json(['message' => 'Merchant deactivated.', 'merchant' => $merchant->only(['id', 'name', 'status'])]);
    }

    /**
     * GET /api/admin/merchants/pending — verification queue (Admin only).
     */
    public function pending(Request $request): JsonResponse
    {
        return response()->json(
            User::pendingMerchants()
                ->select(['id', 'name', 'phone', 'email', 'barangay', 'municipality', 'verification_notes', 'created_at'])
                ->orderByDesc('created_at')
                ->paginate($request->integer('per_page', 30))
        );
    }

    /**
     * POST /api/admin/merchants/{id}/approve (Admin only).
     */
    public function approve(int $id): JsonResponse
    {
        $merchant = User::pendingMerchants()->findOrFail($id);

        $merchant->update([
            'status' => User::STATUS_ACTIVE,
            'verified_at' => now(),
        ]);

        // Provision the default merchant earnings wallet (FR: auto wallet).
        $this->wallets->ensureWallet($merchant->id, Wallet::TYPE_MERCHANT_EARNINGS);

        // Automated approval SMS via Semaphore.
        $this->sms->merchantApproved($merchant->phone);

        // Item 11: in-app notification to the merchant
        app(\App\Services\NotificationService::class)->merchantApproved($merchant->id);

        return response()->json([
            'message' => 'Merchant approved.',
            'merchant' => $merchant->only(['id', 'name', 'phone', 'status', 'verified_at']),
        ]);
    }

    /**
     * POST /api/admin/merchants/{id}/reject (Admin only).
     */
    public function reject(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $merchant = User::pendingMerchants()->findOrFail($id);

        $merchant->update([
            'status' => User::STATUS_REJECTED,
            'verification_notes' => $validated['reason'],
        ]);

        // Automated rejection SMS via Semaphore.
        $this->sms->merchantRejected($merchant->phone, $validated['reason']);

        return response()->json([
            'message' => 'Merchant rejected.',
            'merchant' => $merchant->only(['id', 'name', 'phone', 'status', 'verification_notes']),
        ]);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Wallet;
use App\Services\SmsService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
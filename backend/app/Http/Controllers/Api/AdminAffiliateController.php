<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCashOut;
use App\Models\User;
use App\Models\Wallet;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin affiliate commission tracking & cash-out management.
 */
class AdminAffiliateController extends Controller
{
    public function __construct(
        protected WalletService $wallets,
    ) {}

    /**
     * GET /api/admin/affiliates — list accounts with affiliate earnings.
     * Supports pagination, search, role/city/barangay filters, and sorting.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::whereNotNull('affiliate_code')
            ->with('affiliateWallet')
            ->select(['users.*']);

        // Search: name / phone / affiliate code
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%")
                    ->orWhere('affiliate_code', 'ilike', "%{$search}%");
            });
        }

        // Role filter
        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        // Location filters
        if ($city = $request->input('city')) {
            $query->where('municipality', 'ilike', "%{$city}%");
        }
        if ($barangay = $request->input('barangay')) {
            $query->where('barangay', 'ilike', "%{$barangay}%");
        }

        // Earnings sort (join affiliate wallet balance)
        $sort = $request->input('sort', 'desc');
        $query->leftJoin('wallets as aw', function ($join) {
            $join->on('aw.user_id', '=', 'users.id')
                ->where('aw.wallet_type', '=', 'affiliate_payout');
        })
        ->selectRaw('COALESCE(aw.balance, 0) as earnings_balance')
        ->orderBy('earnings_balance', $sort === 'asc' ? 'asc' : 'desc');

        $affiliates = $query->paginate($request->integer('per_page', 20));

        $affiliates->getCollection()->transform(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'phone' => $u->phone,
            'role' => $u->role,
            'municipality' => $u->municipality,
            'barangay' => $u->barangay,
            'affiliate_code' => $u->affiliate_code,
            'affiliate_status' => $u->affiliate_status ?? 'pending',
            'affiliate_documents' => $u->affiliate_documents ?? [],
            'affiliate_activated_at' => $u->affiliate_activated_at,
            'status' => $u->status,
            'created_at' => $u->created_at,
            'earnings' => (float) ($u->earnings_balance ?? 0),
        ]);

        return response()->json($affiliates);
    }

    /**
     * POST /api/admin/affiliates/{id}/activate — approve an affiliate to cash out.
     */
    public function activate(int $id): JsonResponse
    {
        $user = User::whereNotNull('affiliate_code')->findOrFail($id);

        $user->update([
            'affiliate_status' => 'active',
            'affiliate_activated_at' => now(),
        ]);

        // Notify the affiliate
        app(\App\Services\NotificationService::class)->send(
            $user->id,
            'Affiliate activated',
            'Your affiliate account is now active. You can withdraw your earnings.',
            'affiliate_status',
            '✅',
        );

        return response()->json([
            'message' => 'Affiliate activated. They can now withdraw earnings.',
            'affiliate' => $user->only(['id', 'name', 'affiliate_status', 'affiliate_activated_at']),
        ]);
    }

    /**
     * GET /api/admin/affiliates/cash-outs — cash-out requests (filterable).
     */
    public function cashOuts(Request $request): JsonResponse
    {
        $query = AffiliateCashOut::with('user:id,name,phone')
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('created_at');

        return response()->json($query->paginate($request->integer('per_page', 20)));
    }

    /**
     * POST /api/admin/affiliates/cash-outs/{id}/approve — approve a request.
     * Debits the affiliate wallet; funds released (simulated payout).
     */
    public function approveCashOut(int $id): JsonResponse
    {
        $cashOut = AffiliateCashOut::where('status', AffiliateCashOut::STATUS_PENDING)->findOrFail($id);

        $walletType = $cashOut->wallet_type ?? Wallet::TYPE_AFFILIATE_PAYOUT;
        $wallet = $this->wallets->ensureWallet($cashOut->user_id, $walletType);

        if ((float) $wallet->balance < (float) $cashOut->amount) {
            return response()->json(['message' => 'Insufficient affiliate balance for this payout.'], 422);
        }

        $this->wallets->debit(
            $wallet,
            (float) $cashOut->amount,
            "Affiliate cash-out request #{$cashOut->id}",
            'affiliate_cashout',
            null,
            $cashOut,
        );

        $cashOut->update([
            'status' => AffiliateCashOut::STATUS_PAID,
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return response()->json(['message' => 'Cash-out approved and paid.', 'cash_out' => $cashOut->fresh()]);
    }

    /**
     * POST /api/admin/affiliates/cash-outs/{id}/decline — decline a request.
     */
    public function declineCashOut(int $id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $cashOut = AffiliateCashOut::where('status', AffiliateCashOut::STATUS_PENDING)->findOrFail($id);

        $cashOut->update([
            'status' => AffiliateCashOut::STATUS_DECLINED,
            'decline_reason' => $validated['reason'] ?? null,
        ]);

        return response()->json(['message' => 'Cash-out declined.', 'cash_out' => $cashOut->fresh()]);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AffiliateCashOut;
use App\Models\Hub;
use App\Models\User;
use App\Models\Wallet;
use App\Services\AffiliateService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;

/**
 * Affiliate & referral endpoints (FR-AFF-001..003).
 */
class AffiliateController extends Controller
{
    public function __construct(
        protected AffiliateService $affiliate,
        protected WalletService $wallets,
    ) {}

    /**
     * GET /api/affiliate/referral-qr — QR payload for the hub owner.
     */
    public function referralQr(Request $request): JsonResponse
    {
        $user = $request->user();

        $hub = $user->role === 'admin'
            ? Hub::findOrFail($request->integer('hub_id', 0))
            : $user->hub;

        if (! $hub) {
            return response()->json(['message' => 'No hub bound to your account.'], 404);
        }

        $payload = $this->affiliate->referralQrPayload($hub);

        // QR data-URL (rendered client-side too; here we give the payload)
        return response()->json([
            'hub' => $hub->only(['id', 'name', 'address', 'referral_code']),
            'qr_payload' => $payload,
        ]);
    }

    /**
     * GET /api/affiliate/referral-qr/poster — printable PDF poster.
     * Renders a downloadable poster with the hub owner's referral QR code.
     */
    public function poster(Request $request)
    {
        $user = $request->user();
        $hub = $user->role === 'admin'
            ? Hub::findOrFail($request->integer('hub_id', 0))
            : $user->hub;

        if (! $hub) {
            return response()->json(['message' => 'No hub bound to your account.'], 404);
        }

        $payload = $this->affiliate->referralQrPayload($hub);

        $html = View::make('pdf.referral-poster', [
            'hub' => $hub,
            'qrPayload' => $payload,
            'qrDataUrl' => $this->qrDataUrl($payload),
        ])->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait');

        return $pdf->download("bayanbox-referral-{$hub->referral_code}.pdf");
    }

    /**
     * POST /api/affiliate/register-referral — bind scanned poster.
     */
    public function registerReferral(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'referral_code' => 'required|string|max:15',
        ]);

        try {
            $this->affiliate->registerReferral($request->user(), $validated['referral_code']);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Referral linked.']);
    }

    protected function qrDataUrl(string $payload): string
    {
        // Lightweight QR renderer using the Google Chart API as a zero-dependency
        // fallback; swap with a local library (e.g. chillerlan/php-qrcode) for prod.
        $url = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=20&data='.urlencode($payload);

        try {
            $svg = \Illuminate\Support\Facades\Http::timeout(8)->get($url)->body();
            if (str_contains($svg, '<svg')) {
                return 'data:image/svg+xml;base64,'.base64_encode($svg);
            }
        } catch (\Throwable) {
            // fall through
        }

        return '';
    }

    /**
     * GET /api/affiliate/earnings — my affiliate wallet balance + ledger.
     */
    public function earnings(Request $request): JsonResponse
    {
        $user = $request->user();
        $wallet = $this->wallets->ensureWallet($user->id, Wallet::TYPE_AFFILIATE_PAYOUT);

        return response()->json([
            'balance' => $wallet->balance,
            'referral_code' => $user->affiliate_code,
            'referral_url' => url('/register?ref='.$user->affiliate_code),
            'min_cashout' => (float) config('bayanbox.affiliate.min_cashout', 200),
            'ledger' => $wallet->ledgerTransactions()->latest()->limit(50)->get(),
        ]);
    }

    /**
     * GET /api/affiliate/qr — QR data-URL for the user's affiliate link.
     */
    public function qr(Request $request): JsonResponse
    {
        $user = $request->user();
        $payload = url('/register?ref='.$user->affiliate_code);

        return response()->json([
            'referral_code' => $user->affiliate_code,
            'url' => $payload,
            'qr_data_url' => $this->qrDataUrl($payload),
        ]);
    }

    /**
     * POST /api/affiliate/cash-out — request affiliate commission cash-out.
     */
    public function requestCashOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $user = $request->user();
        $wallet = $this->wallets->ensureWallet($user->id, Wallet::TYPE_AFFILIATE_PAYOUT);
        $amount = round((float) $validated['amount'], 2);
        $min = (float) config('bayanbox.affiliate.min_cashout', 200);

        if ($amount < $min) {
            return response()->json([
                'message' => "Minimum cash-out is ₱".number_format($min, 2).'.',
            ], 422);
        }

        if ((float) $wallet->balance < $amount) {
            return response()->json([
                'message' => 'Insufficient affiliate earnings.',
            ], 422);
        }

        // Prevent duplicate pending requests
        $hasPending = AffiliateCashOut::where('user_id', $user->id)
            ->where('status', AffiliateCashOut::STATUS_PENDING)
            ->exists();

        if ($hasPending) {
            return response()->json(['message' => 'You already have a pending cash-out request.'], 422);
        }

        $cashOut = AffiliateCashOut::create([
            'user_id' => $user->id,
            'amount' => $amount,
            'status' => AffiliateCashOut::STATUS_PENDING,
            'requested_at' => now(),
        ]);

        return response()->json([
            'message' => 'Cash-out requested. Admin will review.',
            'cash_out' => $cashOut,
        ], 201);
    }

    /**
     * GET /api/affiliate/cash-outs — my cash-out history.
     */
    public function cashOutHistory(Request $request): JsonResponse
    {
        return response()->json(
            AffiliateCashOut::where('user_id', $request->user()->id)
                ->orderByDesc('created_at')
                ->paginate($request->integer('per_page', 20))
        );
    }
}
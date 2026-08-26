<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hub;
use App\Services\AffiliateService;
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
}
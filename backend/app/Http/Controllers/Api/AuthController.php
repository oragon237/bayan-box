<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordOtp;
use App\Models\User;
use App\Services\AffiliateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        protected AffiliateService $affiliate,
    ) {}

    /**
     * POST /api/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:20|unique:users,phone',
            'email' => 'nullable|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => ['sometimes', 'string', Rule::in(['customer', 'merchant', 'rider', 'provider'])],
            'referral_code' => 'nullable|string|max:15',
            'barangay' => 'nullable|string|max:100',
            'municipality' => 'nullable|string|max:100',
            // Module 1: merchant verification documents
            'dti_sec_number' => 'required_if:role,merchant|nullable|string|max:50',
            'government_id_url' => 'nullable|string|max:255',
            'business_permit_url' => 'nullable|string|max:255',
            'picture_url' => 'nullable|string|max:255',
            'verification_message' => 'nullable|string|max:500',
        ]);

        $role = $validated['role'] ?? 'customer';
        $isMerchant = $role === 'merchant';

        $verificationNotes = null;
        if ($isMerchant) {
            $verificationNotes = json_encode([
                'dti_sec_number' => $validated['dti_sec_number'] ?? null,
                'government_id_url' => $validated['government_id_url'] ?? null,
                'business_permit_url' => $validated['business_permit_url'] ?? null,
                'picture_url' => $validated['picture_url'] ?? null,
                'verification_message' => $validated['verification_message'] ?? null,
                'submitted_at' => now()->toIso8601String(),
            ]);
        }

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'password_hash' => Hash::make($validated['password']),
            'role' => $role,
            'status' => $isMerchant ? User::STATUS_PENDING : User::STATUS_ACTIVE, // Module 1
            'verification_notes' => $verificationNotes,
            'affiliate_code' => $this->generateAffiliateCode(),
            'barangay' => $validated['barangay'] ?? null,
            'municipality' => $validated['municipality'] ?? null,
        ]);

        // FR-AFF-001: Register referral link if scanned a hub poster.
        // Track attribution outcome so the user can be informed (F5).
        $referralStatus = 'none';
        if (! empty($validated['referral_code'])) {
            try {
                $this->affiliate->registerReferral($user, $validated['referral_code']);
                $referralStatus = 'applied';
            } catch (\Throwable) {
                $referralStatus = 'invalid'; // surfaced to the user, non-blocking
            }
        } elseif ($isMerchant) {
            $referralStatus = 'none';
        }

        // Item 11: notify admins of a new merchant applicant
        if ($isMerchant) {
            app(\App\Services\NotificationService::class)->adminNewApplicant();
        }

        return response()->json([
            'user' => $user->only(['id', 'name', 'phone', 'role', 'affiliate_code', 'barangay', 'municipality']),
            'referral_status' => $referralStatus,
            'token' => $user->createToken('bayanbox-pwa', [$user->role])->plainTextToken,
        ], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('phone', $validated['phone'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password_hash)) {
            throw ValidationException::withMessages([
                'phone' => ['The provided credentials are incorrect.'],
            ]);
        }

        return response()->json([
            'user' => $user->only(['id', 'name', 'phone', 'role', 'affiliate_code', 'barangay', 'municipality', 'status']),
            'token' => $user->createToken(
                'bayanbox-pwa',
                [$user->role],
                now()->addMinutes((int) config('sanctum.expiration', 1440)),
            )->plainTextToken,
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * POST /api/auth/forgot-password — start a phone-OTP reset.
     * No SMS/email gateway is wired in this build, so the code is written to
     * the app log and (only while APP_DEBUG=true) returned as `demo_code`
     * so the flow is testable. Responds identically for unknown numbers.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        $message = 'If that number is registered, a 6-digit verification code valid for 10 minutes has been sent.';
        $user = User::where('phone', $validated['phone'])->first();

        if ($user) {
            $code = (string) random_int(100000, 999999);
            PasswordOtp::create([
                'user_id' => $user->id,
                'code_hash' => hash('sha256', $code),
                'expires_at' => now()->addMinutes(10),
            ]);
            logger("Password reset code for {$user->phone}: {$code}");

            if (config('app.debug')) {
                $message .= ' (Demo build: code is '.$code.'.)';
            }
        }

        return response()->json(['message' => $message]);
    }

    /**
     * POST /api/auth/reset-password — verify the OTP and set a new password.
     * Consumes every outstanding code for the user and signs out all devices.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string|max:20',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::where('phone', $validated['phone'])->first();

        $otp = $user
            ? PasswordOtp::where('user_id', $user->id)
                ->whereNull('consumed_at')
                ->where('expires_at', '>', now())
                ->latest('id')
                ->first()
            : null;

        if (! $otp || ! hash_equals($otp->code_hash, hash('sha256', $validated['code']))) {
            throw ValidationException::withMessages([
                'code' => ['Invalid or expired verification code.'],
            ]);
        }

        $otp->update(['consumed_at' => now()]);
        PasswordOtp::where('user_id', $user->id)->whereNull('consumed_at')->update(['consumed_at' => now()]);
        $user->forceFill(['password_hash' => Hash::make($validated['password'])])->save();
        $user->tokens()->delete();

        return response()->json(['message' => 'Password updated. Sign in with your new password.']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'wallets',
            'hub',
            'providerProfile',
            'referredBy',
        ]);

        return response()->json([
            'user' => $user,
            'loyalty_balance' => $user->loyaltyBalance(),
        ]);
    }

    protected function generateAffiliateCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (User::where('affiliate_code', $code)->exists());

        return $code;
    }
}
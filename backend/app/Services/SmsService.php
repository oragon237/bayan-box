<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Semaphore SMS gateway — sends pickup OTPs and transit status updates
 * (FR-OFF-003). Falls back silently when the API key is absent so local
 * development never hard-fails.
 */
class SmsService
{
    protected string $apiKey;
    protected string $senderName;

    public function __construct()
    {
        $this->apiKey = config('services.semaphore.api_key', env('SEMAPHORE_API_KEY', ''));
        $this->senderName = config('services.semaphore.sender_name', env('SEMAPHORE_SENDER_NAME', 'BayanBox'));
    }

    /**
     * Send a pickup OTP code to the recipient.
     */
    public function sendPickupOtp(string $phone, string $otp, string $trackingNumber): bool
    {
        $message = strtr(config('bayanbox.otp.sms_template'), [
            '{otp}' => $otp,
            '{ttl_minutes}' => config('bayanbox.otp.ttl_minutes', 48),
            '{tracking}' => $trackingNumber,
        ]);

        return $this->send($phone, $message);
    }

    /**
     * Send a generic status update (e.g. "Out for delivery").
     */
    public function sendStatusUpdate(string $phone, string $trackingNumber, string $status): bool
    {
        $message = sprintf(
            'BayanBox update: parcel %s is now %s. Track at %s/track/%s',
            $trackingNumber,
            strtoupper(str_replace('_', ' ', $status)),
            config('app.url', 'http://localhost:8000'),
            $trackingNumber
        );

        return $this->send($phone, $message);
    }

    /**
     * POST to Semaphore API.
     */
    protected function send(string $phone, string $message): bool
    {
        if (blank($this->apiKey)) {
            Log::info('bayanbox.sms.skipped', compact('phone', 'message'));

            return false;
        }

        // Normalise Philippine mobile number
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($phone) === 10) {
            $phone = '63'.$phone;
        } elseif (str_starts_with($phone, '0')) {
            $phone = '63'.substr($phone, 1);
        }

        try {
            $response = Http::timeout(10)
                ->asForm()
                ->post('https://api.semaphore.co/api/v4/messages', [
                    'apikey' => $this->apiKey,
                    'number' => $phone,
                    'message' => $message,
                    'sendername' => $this->senderName,
                ]);

            $success = $response->successful();

            if (! $success) {
                Log::warning('bayanbox.sms.failed', [
                    'phone' => substr($phone, 0, 7).'****',
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }

            return $success;
        } catch (\Throwable $e) {
            Log::error('bayanbox.sms.exception', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
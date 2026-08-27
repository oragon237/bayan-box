<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Semaphore SMS gateway (Module 1 — verification notifications).
 *
 * Sends SMS through Semaphore's v4 API. When SEMAPHORE_API_KEY is unset
 * (local/demo), the send is skipped and logged instead of failing.
 */
class SmsService
{
    public function send(string $phone, string $message): bool
    {
        $apiKey = config('services.semaphore.api_key');

        if (blank($apiKey)) {
            Log::info("SMS skipped (no Semaphore key): {$phone} → {$message}");

            return false;
        }

        try {
            $response = Http::asForm()->post('https://api.semaphore.co/api/v4/messages', [
                'apikey' => $apiKey,
                'number' => $phone,
                'message' => $message,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::warning('Semaphore SMS failed: '.$e->getMessage());

            return false;
        }
    }

    public function merchantApproved(string $phone): void
    {
        $this->send($phone, 'Suki! Your BayanBox Merchant Account is now APPROVED. You can now upload products.');
    }

    public function merchantRejected(string $phone, ?string $reason): void
    {
        $message = 'Your BayanBox Merchant application was not approved.';
        if ($reason) {
            $message .= " Reason: {$reason}";
        }
        $this->send($phone, $message);
    }
}
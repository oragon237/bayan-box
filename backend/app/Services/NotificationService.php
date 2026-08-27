<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

/**
 * In-app notification dispatcher (item 11).
 */
class NotificationService
{
    /**
     * Send a notification to a user.
     */
    public function send(int $userId, string $title, ?string $body = null, string $type = 'general', ?string $icon = null, array $data = []): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'body' => $body,
            'type' => $type,
            'icon' => $icon,
            'data' => $data,
        ]);
    }

    /**
     * Send to all users of a role.
     */
    public function sendToRole(string $role, string $title, ?string $body = null, string $type = 'general', ?string $icon = null, array $data = []): void
    {
        User::where('role', $role)->where('status', 'active')->get()
            ->each(fn ($u) => $this->send($u->id, $title, $body, $type, $icon, $data));
    }

    // ── Convenience triggers ──────────────────────────────────────────────

    public function merchantNewOrder(int $merchantId, int $orderId): void
    {
        $this->send($merchantId, 'New order received', "You have a new order (#{$orderId}) to fulfill.", 'merchant_order', '📦', ['order_id' => $orderId]);
    }

    public function merchantApproved(int $merchantId): void
    {
        $this->send($merchantId, 'Merchant approved', 'Your merchant account is approved. You can now upload products.', 'merchant_status', '✅');
    }

    public function merchantRejected(int $merchantId, ?string $reason = null): void
    {
        $this->send($merchantId, 'Merchant application not approved', $reason ? "Reason: {$reason}" : null, 'merchant_status', '❌');
    }

    public function adminNewApplicant(int $count = 1): void
    {
        $this->sendToRole('admin', 'New merchant applicant', "{$count} merchant(s) are waiting for verification.", 'admin_applicant', '🔔');
    }

    public function riderEmergency(int $riderId, ?string $message = null): void
    {
        $this->sendToRole('admin', 'Rider emergency report', $message ?? "Rider #{$riderId} reported an emergency.", 'rider_emergency', '🚨', ['rider_id' => $riderId]);
    }

    public function providerJob(int $providerId, string $title, ?string $body = null, array $data = []): void
    {
        $this->send($providerId, $title, $body, 'provider_job', '🧑‍🔧', $data);
    }

    public function customerOrder(int $customerId, string $title, ?string $body = null, array $data = []): void
    {
        $this->send($customerId, $title, $body, 'order', '📦', $data);
    }
}
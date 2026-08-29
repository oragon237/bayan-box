<?php

namespace App\Services;

use App\Models\Hub;
use App\Models\Order;
use App\Models\Parcel;
use App\Models\PendingAffiliateCommission;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Affiliate & micro-referral engine (FR-AFF-001..003).
 *
 * Marketplace commissions are held in escrow for a grace period
 * (commission_hold_hours) so cancelled orders void the commission before
 * it ever reaches the affiliate wallet.
 */
class AffiliateService
{
    public function __construct(
        protected WalletService $walletService,
    ) {}

    /**
     * FR-AFF-001: QR payload rendered on printable hub posters.
     * Scanning it registers a customer with referred_by_id = hub owner.
     */
    public function referralQrPayload(Hub $hub): string
    {
        $code = $hub->referral_code
            ?? throw new RuntimeException('Hub has no referral code assigned.');

        return rtrim(config('bayanbox.affiliate.poster_base_url', url('/')), '/')
            .'/api/r/'.$code;
    }

    /**
     * Register a customer who scanned a hub referral poster OR a user's
     * affiliate QR/link. Links the customer to the referrer.
     */
    public function registerReferral(User $customer, string $referralCode): bool
    {
        // 1. Hub referral code → hub staff
        $hub = Hub::where('referral_code', $referralCode)->first();
        if ($hub && $hub->staff_id) {
            $customer->referred_by_id = $hub->staff_id;
            $customer->save();

            return true;
        }

        // 2. User affiliate code → that user (no self-referral)
        $referrer = User::where('affiliate_code', $referralCode)
            ->where('id', '!=', $customer->id)
            ->first();
        if ($referrer) {
            $customer->referred_by_id = $referrer->id;
            $customer->save();

            return true;
        }

        throw new RuntimeException('Invalid referral code.');
    }

    /**
     * FR-AFF-002: credit the permanent ₱2.00 micro-commission on every
     * future parcel the referred customer processes through the hub.
     * Idempotent — guarded by parcels.referral_commission_paid_at.
     */
    public function payoutReferralCommission(Parcel $parcel): void
    {
        if ($parcel->referral_commission_paid_at) {
            return;
        }

        if (! $parcel->referred_by_id) {
            return;
        }

        DB::transaction(function () use ($parcel) {
            $referrer = User::query()->lockForUpdate()->find($parcel->referred_by_id);
            if (! $referrer) {
                return;
            }

            $wallet = $this->walletService->ensureWallet($referrer->id, Wallet::TYPE_AFFILIATE_PAYOUT);
            $amount = (float) config('bayanbox.affiliate.micro_commission_per_parcel', 2.00);

            $this->walletService->credit(
                $wallet,
                $amount,
                "Affiliate micro-commission — parcel {$parcel->tracking_number}",
                'affiliate_commission',
                null,
                $parcel,
            );

            $parcel->forceFill(['referral_commission_paid_at' => now()])->save();
        });
    }

    /**
     * FR-AFF-003: grant a 30-day Return Shield Credit once a referred merchant
     * ships their first 10 consolidated parcels. Called after each merchant
     * parcel registration.
     */
    public function maybeGrantReturnShield(User $merchant): ?array
    {
        $threshold = (int) config('bayanbox.affiliate.b2b_referral_threshold_shipments', 10);

        $shipmentCount = Parcel::where('shipper_name', $merchant->name)->count();

        if ($shipmentCount < $threshold) {
            return null;
        }

        // Grant only once: keyed on the merchant + a fixed benefit descriptor.
        $granted = DB::table('return_shield_grants')
            ->where('merchant_id', $merchant->id)
            ->exists();

        if ($granted) {
            return null;
        }

        $days = (int) config('bayanbox.affiliate.b2b_return_shield_days', 30);
        $discount = config('bayanbox.affiliate.b2b_return_shield_discount_percent', 50.00);
        $expiresAt = now()->addDays($days);

        DB::table('return_shield_grants')->insert([
            'merchant_id' => $merchant->id,
            'discount_percent' => $discount,
            'starts_at' => now(),
            'expires_at' => $expiresAt,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'merchant_id' => $merchant->id,
            'discount_percent' => $discount,
            'expires_at' => $expiresAt,
        ];
    }

    /**
     * FR-AFF-004: hold a marketplace commission in escrow for the grace
     * period. The affiliate wallet is NOT credited yet — the amount stays in
     * the sales escrow until held_until passes without cancellation.
     */
    public function holdCommission(Order $order, User $affiliate, float $amount): PendingAffiliateCommission
    {
        $hours = (int) config('bayanbox.affiliate.commission_hold_hours', 72);

        return PendingAffiliateCommission::create([
            'order_id' => $order->id,
            'affiliate_id' => $affiliate->id,
            'amount' => round($amount, 2),
            'held_until' => now()->addHours($hours),
            'status' => PendingAffiliateCommission::STATUS_PENDING,
        ]);
    }

    /**
     * Release all vested marketplace commissions (held_until passed and the
     * order was not cancelled). Transfers escrow → affiliate wallet and marks
     * the hold released. Called hourly by `affiliate:release-commissions`.
     */
    public function releaseVestedCommissions(): int
    {
        $escrow = $this->walletService->ensureWallet(
            (int) config('bayanbox.ledger.platform_user_id', 1),
            Wallet::TYPE_SALES_ESCROW,
        );

        $released = 0;

        PendingAffiliateCommission::where('status', PendingAffiliateCommission::STATUS_PENDING)
            ->where('held_until', '<=', now())
            ->orderBy('id')
            ->chunkById(200, function ($records) use ($escrow, &$released) {
                foreach ($records as $record) {
                    $order = $record->order;

                    // Order was cancelled within the grace window → void, no payout
                    if ($order && in_array($order->delivery_state, [Order::STATE_CANCELLED], true)) {
                        $record->update([
                            'status' => PendingAffiliateCommission::STATUS_CANCELLED,
                            'cancelled_at' => now(),
                        ]);
                        continue;
                    }

                    $affiliateWallet = $this->walletService->ensureWallet(
                        $record->affiliate_id,
                        Wallet::TYPE_AFFILIATE_PAYOUT,
                    );

                    $this->walletService->transfer(
                        $escrow,
                        $affiliateWallet,
                        (float) $record->amount,
                        "Affiliate reward Order #{$record->order_id} (grace period released)",
                        'affiliate_commission',
                        $order ?? $record->order,
                    );

                    $record->update([
                        'status' => PendingAffiliateCommission::STATUS_RELEASED,
                        'released_at' => now(),
                    ]);
                    $released++;
                }
            });

        return $released;
    }

    /**
     * Void all still-pending commissions for an order (called on cancellation).
     * The money was never credited to the affiliate — it simply stays in escrow.
     */
    public function voidPendingForOrder(Order $order): int
    {
        return PendingAffiliateCommission::where('order_id', $order->id)
            ->where('status', PendingAffiliateCommission::STATUS_PENDING)
            ->update([
                'status' => PendingAffiliateCommission::STATUS_CANCELLED,
                'cancelled_at' => now(),
            ]);
    }
}

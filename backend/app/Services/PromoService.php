<?php

namespace App\Services;

use App\Models\Parcel;
use App\Models\PromoCode;
use App\Models\PromoRedemption;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Geo-targeted promo code engine (FR-PROMO-001..003).
 *
 * Validates barangay/hub scope, volume thresholds, caps, expiry windows and
 * transaction minimums before applying a discount atomically.
 */
class PromoService
{
    /**
     * Validate + apply a promo code to a parcel pickup transaction.
     *
     * @return array{ applied_discount: float, promo_code: PromoCode, redemption: PromoRedemption }
     */
    public function apply(
        string $code,
        User $user,
        Parcel $parcel,
        float $transactionAmount,
        array $options = [],
    ): array {
        return DB::transaction(function () use ($code, $user, $parcel, $transactionAmount, $options) {
            $promo = PromoCode::where('code', $code)->lockForUpdate()->first();

            if (! $promo || ! $promo->is_active) {
                throw new RuntimeException('Promo code not found or inactive.');
            }

            $this->assertDateWindow($promo);
            $this->assertCap($promo);
            $this->assertMinimums($promo, $transactionAmount, $parcel, $options);

            // Geo-scope check (FR-PROMO-001)
            $hubId = $parcel->hub_id;
            $barangay = $parcel->destination_barangay ?? $parcel->hub?->barangay;
            if (! $promo->appliesTo($hubId, $barangay)) {
                throw new RuntimeException("Promo code '{$code}' is not valid for this hub/barangay.");
            }

            $discount = $this->discountAmount($promo, $transactionAmount);

            $redemption = PromoRedemption::create([
                'promo_code_id' => $promo->id,
                'user_id' => $user->id,
                'parcel_id' => $parcel->id,
                'discounted_amount' => $discount,
                'reference' => $options['reference'] ?? null,
            ]);

            $promo->increment('used_count');

            return [
                'applied_discount' => $discount,
                'promo_code' => $promo,
                'redemption' => $redemption,
            ];
        });
    }

    protected function assertDateWindow(PromoCode $promo): void
    {
        $now = now();

        if ($promo->starts_at && $now->lt($promo->starts_at)) {
            throw new RuntimeException('Promo code has not started yet.');
        }

        if ($promo->expires_at && $now->gt($promo->expires_at)) {
            throw new RuntimeException('Promo code has expired.');
        }
    }

    protected function assertCap(PromoCode $promo): void
    {
        if ($promo->max_uses > 0 && $promo->used_count >= $promo->max_uses) {
            throw new RuntimeException('Promo code usage limit reached.');
        }
    }

    protected function assertMinimums(PromoCode $promo, float $transactionAmount, Parcel $parcel, array $options): void
    {
        if ($promo->min_transaction_amount > 0 && $transactionAmount < $promo->min_transaction_amount) {
            throw new RuntimeException("Promo requires a minimum transaction of ₱{$promo->min_transaction_amount}.");
        }

        // Volume consolidation rule (FR-PROMO-002): count parcels picked up in
        // the same transaction via the `parcel_count` option.
        $parcelCount = $options['parcel_count'] ?? 1;
        if ($promo->min_parcels_per_transaction > 1 && $parcelCount < $promo->min_parcels_per_transaction) {
            throw new RuntimeException("Promo requires {$promo->min_parcels_per_transaction} or more parcels in this pickup.");
        }
    }

    protected function discountAmount(PromoCode $promo, float $transactionAmount): float
    {
        return match ($promo->discount_type) {
            'flat' => min($promo->discount_value, $transactionAmount),
            'percent' => min(round($transactionAmount * $promo->discount_value / 100, 2), $transactionAmount),
            'free_delivery' => $transactionAmount, // treated as 100% off the delivery fee leg
            default => 0.0,
        };
    }
}
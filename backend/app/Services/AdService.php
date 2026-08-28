<?php

namespace App\Services;

use App\Models\AdCampaign;
use App\Models\Product;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Merchant product advertising engine.
 */
class AdService
{
    public function __construct(
        protected WalletService $wallets,
        protected LoyaltyService $loyalty,
    ) {}

    /**
     * Daily rate for an ad type.
     */
    public function rate(string $adType): float
    {
        return (float) config("bayanbox.ads.rates.{$adType}", 50.00);
    }

    /**
     * Launch an ad campaign, deducting payment (wallet balance or points).
     */
    public function launch(User $merchant, Product $product, string $adType, int $days, string $paymentMethod): AdCampaign
    {
        $dailyRate = $this->rate($adType);
        $totalCost = round($dailyRate * $days, 2);

        return DB::transaction(function () use ($merchant, $product, $adType, $days, $paymentMethod, $totalCost, $dailyRate) {
            if ($paymentMethod === 'points') {
                $this->loyalty->burn(
                    $merchant,
                    (int) $totalCost,
                    'ad_campaign',
                    "Ad campaign for {$product->name}",
                    $product,
                );
            } else {
                $wallet = $this->wallets->ensureWallet($merchant->id, Wallet::TYPE_MERCHANT_EARNINGS);
                $this->wallets->debit(
                    $wallet,
                    $totalCost,
                    "Ad campaign for {$product->name}",
                    'ad_campaign',
                    null,
                    $product,
                );
            }

            return AdCampaign::create([
                'product_id' => $product->id,
                'merchant_id' => $merchant->id,
                'ad_type' => $adType,
                'daily_rate' => $dailyRate,
                'duration_days' => $days,
                'total_cost' => $totalCost,
                'start_date' => now(),
                'end_date' => now()->addDays($days),
                'status' => 'active',
                'payment_method' => $paymentMethod,
            ]);
        });
    }
}
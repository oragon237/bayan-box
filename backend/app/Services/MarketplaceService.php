<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Hub;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Local e-commerce marketplace checkout engine (FR-MKT-005..007).
 *
 * Processes a multi-merchant cart inside a single DB transaction:
 *  - validates stock, locks prices at purchase time
 *  - creates the order + order items
 *  - deducts inventory
 *  - splits funds: 90% merchant / 10% platform, minus any product-level
 *    affiliate payout, plus per-product Suki Points for the customer, and
 *    routes the delivery fee 85% rider / 15% platform (or the ₱10 pickup
 *    handling fee ₱5 hub / ₱5 platform).
 */
class MarketplaceService
{
    public function __construct(
        protected WalletService $wallets,
        protected LoyaltyService $loyalty,
        protected DeliveryPricingService $pricing,
    ) {}

    /**
     * Checkout the current user's cart. Returns the created order.
     */
    public function processCheckout(User $customer, array $payload): Order
    {
        $fulfillment = $payload['fulfillment_type'] ?? Order::FULFILLMENT_PICKUP;

        // Resolve shipping amount based on fulfillment mode (no DB locks needed)
        $shippingAmount = 0.00;
        $shippingDetail = null;

        if ($fulfillment === Order::FULFILLMENT_DELIVERY) {
            $shippingDetail = $this->resolveDoorstepShipping($payload);
            $shippingAmount = $shippingDetail['total_delivery_fee'];
        } elseif ($fulfillment === Order::FULFILLMENT_PICKUP) {
            // FR-MKT-007: click-and-collect handling fee (halved hub / platform)
            $shippingAmount = (float) config('bayanbox.marketplace.pickup_handling_fee', 10.00);
        }

        // Resolve optional affiliate referral (no self-referral)
        $affiliate = null;
        if (! empty($payload['referral_code'])) {
            $affiliate = User::where('affiliate_code', $payload['referral_code'])
                ->where('id', '!=', $customer->id)
                ->first();
        }

        return DB::transaction(function () use ($customer, $payload, $fulfillment, $shippingAmount, $shippingDetail, $affiliate) {
            // Re-read the cart inside the transaction, locking product rows so
            // the stock check + decrement are atomic across concurrent checkouts.
            $items = CartItem::with(['product' => fn ($q) => $q->lockForUpdate()])
                ->where('customer_id', $customer->id)
                ->get();

            if ($items->isEmpty()) {
                throw new RuntimeException('Cart is empty.');
            }

            $productTotal = 0.00;

            // 1. Validate stock & sum the product total (sale price applied)
            foreach ($items as $cartItem) {
                $product = $cartItem->product;
                if (! $product || $product->status !== 'active' || $product->availability !== 'available') {
                    throw new RuntimeException("Product unavailable: {$product?->name}");
                }
                if ($product->stock < $cartItem->quantity) {
                    throw new RuntimeException("Insufficient stock for {$product->name}.");
                }
                $productTotal += $product->effectivePrice() * $cartItem->quantity;
            }

            // Platform wallet is shared across all splits
            $platformWallet = $this->wallets->ensureWallet(
                (int) config('bayanbox.ledger.platform_user_id', 1),
                Wallet::TYPE_PLATFORM_EARNINGS,
            );

            // 2. Create the master order
            $isCod = ($payload['payment_method'] ?? 'gcash') === 'cod';
            $order = Order::create([
                'customer_id' => $customer->id,
                'total_amount' => round($productTotal, 2),
                'shipping_amount' => round($shippingAmount, 2),
                'fulfillment_type' => $fulfillment,
                'hub_id' => $fulfillment === Order::FULFILLMENT_PICKUP ? ($payload['hub_id'] ?? null) : null,
                'delivery_address' => $fulfillment === Order::FULFILLMENT_DELIVERY ? ($payload['delivery_address'] ?? null) : null,
                'latitude' => $fulfillment === Order::FULFILLMENT_DELIVERY ? ($payload['latitude'] ?? null) : null,
                'longitude' => $fulfillment === Order::FULFILLMENT_DELIVERY ? ($payload['longitude'] ?? null) : null,
                'referring_affiliate_id' => $affiliate?->id,
                'payment_method' => $payload['payment_method'] ?? 'gcash',
                'status' => $isCod ? 'pending_payment' : 'paid', // COD: rider collects at delivery
            ]);

            // 3. Per-item: record receipt, deduct stock, split the ledger
            foreach ($items as $cartItem) {
                $product = $cartItem->product;
                $unitPrice = $product->effectivePrice();
                $itemTotal = $unitPrice * $cartItem->quantity;
                $pointsAwarded = $product->suki_points_award * $cartItem->quantity;

                $affiliatePayout = 0.00;
                if ($affiliate && $product->affiliate_percentage > 0) {
                    $affiliatePayout = round($itemTotal * ($product->affiliate_percentage / 100), 2);
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $cartItem->quantity,
                    'price_at_purchase' => $unitPrice,
                    'suki_points_awarded' => $pointsAwarded,
                    'affiliate_payout_amount' => $affiliatePayout,
                ]);

                // Atomic conditional decrement prevents overselling under
                // concurrent checkouts (the product row is lockForUpdate'd).
                $affected = Product::where('id', $product->id)
                    ->where('stock', '>=', $cartItem->quantity)
                    ->decrement('stock', $cartItem->quantity);
                if ($affected === 0) {
                    throw new RuntimeException("Insufficient stock for {$product->name}.");
                }

                // Module 2: BeCoolBox Mall — 100% to admin_earnings, 0% rake
                if ($product->is_official_mall) {
                    $adminPayout = round($itemTotal, 2) - $affiliatePayout;
                    $adminWallet = $this->wallets->ensureWallet(
                        (int) config('bayanbox.ledger.platform_user_id', 1),
                        Wallet::TYPE_ADMIN_EARNINGS,
                    );
                    if ($adminPayout > 0) {
                        $this->wallets->credit(
                            $adminWallet, $adminPayout,
                            "BeCoolBox Mall sale Order #{$order->id} — {$product->name}",
                            'mall_sale', null, $order,
                        );
                    }
                } else {
                    // Merchant share (configurable percentage), minus affiliate cut
                    $merchantPct = (float) config('bayanbox.marketplace.merchant_share_percent', 90.00);
                    $merchantPayout = round($itemTotal * ($merchantPct / 100), 2) - $affiliatePayout;
                    if ($merchantPayout > 0) {
                        $merchantWallet = $this->wallets->ensureWallet($product->merchant_id, Wallet::TYPE_MERCHANT_EARNINGS);
                        $this->wallets->credit(
                            $merchantWallet, $merchantPayout,
                            "Marketplace sale Order #{$order->id} — {$product->name}",
                            'marketplace_sale', null, $order,
                        );
                    }

                    // Platform commission (configurable percentage)
                    $platformPct = (float) config('bayanbox.marketplace.platform_commission_percent', 10.00);
                    $this->wallets->credit(
                        $platformWallet, round($itemTotal * ($platformPct / 100), 2),
                        "Platform commission Order #{$order->id}",
                        'marketplace_commission', null, $order,
                    );
                }

                // Affiliate: product-level commission to the referrer
                if ($affiliate && $affiliatePayout > 0) {
                    $affiliateWallet = $this->wallets->ensureWallet($affiliate->id, Wallet::TYPE_AFFILIATE_PAYOUT);
                    $this->wallets->credit(
                        $affiliateWallet, $affiliatePayout,
                        "Affiliate reward Order #{$order->id} — {$product->name}",
                        'affiliate_commission', null, $order,
                    );
                }

                // Customer: Suki Points (FR-MKT-002)
                if ($pointsAwarded > 0) {
                    $this->loyalty->award(
                        $customer, $pointsAwarded, 'purchase_reward',
                        "Purchase reward Order #{$order->id} — {$product->name}", $order,
                    );
                }
            }

            // 4. Fulfillment ledger splits
            if ($fulfillment === Order::FULFILLMENT_DELIVERY && $shippingDetail) {
                $riderShare = (float) $shippingDetail['rider_share'];
                $platformShare = (float) $shippingDetail['platform_share'];

                // The rider share falls back to the platform when no active
                // rider wallet exists so the fee is never unaccounted.
                $riderWallet = $this->resolveRiderWallet();
                $riderWallet ??= $platformWallet;

                if ($riderShare > 0) {
                    $this->wallets->credit(
                        $riderWallet, $riderShare,
                        $riderWallet->id === $platformWallet->id
                            ? "Unassigned rider delivery share Order #{$order->id}"
                            : "Rider delivery share Order #{$order->id}",
                        'delivery_split', null, $order,
                    );
                }
                if ($platformShare > 0) {
                    $this->wallets->credit(
                        $platformWallet, $platformShare,
                        "Platform delivery share Order #{$order->id}",
                        'delivery_split', null, $order,
                    );
                }
            } elseif ($fulfillment === Order::FULFILLMENT_PICKUP) {
                // Handling fee halved: hub staff / platform (FR-MKT-007)
                $handlingHalf = round($shippingAmount / 2, 2);
                $hubId = $payload['hub_id'] ?? null;
                $hubStaffId = $hubId ? optional(Hub::find($hubId)->staff)->id : null;

                // When the hub has no bound staff, the hub share falls back to
                // the platform so the collected fee is fully accounted.
                $hubWallet = $hubStaffId
                    ? $this->wallets->ensureWallet($hubStaffId, Wallet::TYPE_MERCHANT_EARNINGS)
                    : $platformWallet;

                $this->wallets->credit(
                    $hubWallet, $handlingHalf,
                    $hubWallet->id === $platformWallet->id
                        ? "Unassigned hub handling fee Order #{$order->id}"
                        : "Click-and-collect handling fee Order #{$order->id}",
                    'pickup_handling_fee', null, $order,
                );
                $this->wallets->credit(
                    $platformWallet, $handlingHalf,
                    "Click-and-collect handling fee Order #{$order->id}",
                    'pickup_handling_fee', null, $order,
                );
            }

            // 5. Clear the cart
            CartItem::where('customer_id', $customer->id)->delete();

            return $order->load('items.product');
        });
    }

    /**
     * Calculate the doorstep shipping fee from the nearest hub to the
     * customer's coordinate using the dynamic per-km calculator (FR-MKT-006).
     */
    protected function resolveDoorstepShipping(array $payload): array
    {
        $hub = Hub::orderBy('id')->first();

        return $this->pricing->calculateFee(
            (float) $hub?->latitude,
            (float) $hub?->longitude,
            (float) $payload['latitude'],
            (float) $payload['longitude'],
            $payload['municipality'] ?? null,
        );
    }

    /**
     * Pick the first active rider for the delivery payout. Returns null when
     * no rider exists yet (payout is then skipped).
     */
    protected function resolveRiderWallet(): ?Wallet
    {
        $rider = User::where('role', 'rider')->where('status', 'active')->first();

        return $rider ? $this->wallets->ensureWallet($rider->id, Wallet::TYPE_RIDER_PREPAID) : null;
    }
}
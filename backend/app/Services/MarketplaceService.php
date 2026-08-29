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
        protected AffiliateService $affiliate,
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

        // Resolve affiliate: from an explicit referral code at checkout, or the
        // account's registered referrer (linked via QR/referral link).
        $affiliate = null;
        if (! empty($payload['referral_code'])) {
            $affiliate = User::where('affiliate_code', $payload['referral_code'])
                ->where('id', '!=', $customer->id)
                ->first();
        }
        if (! $affiliate && $customer->referred_by_id) {
            $affiliate = User::find($customer->referred_by_id);
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
            $pointsTotal = 0;

            // 1. Validate stock & sum the product total (sale price applied).
            //    Points-only items are priced in Suki Points, not cash.
            foreach ($items as $cartItem) {
                $product = $cartItem->product;
                if (! $product || $product->status !== 'active' || $product->availability !== 'available') {
                    throw new RuntimeException("Product unavailable: {$product?->name}");
                }
                if ($product->stock < $cartItem->quantity) {
                    throw new RuntimeException("Insufficient stock for {$product->name}.");
                }
                if ($product->points_only) {
                    $pointsTotal += (int) $product->points_price * $cartItem->quantity;
                } else {
                    $productTotal += $product->effectivePrice() * $cartItem->quantity;
                }
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
                'fulfillment_status' => Order::FULFILL_PENDING,
                'delivery_state' => Order::STATE_PENDING_MERCHANT,
                'hub_id' => $fulfillment === Order::FULFILLMENT_PICKUP ? ($payload['hub_id'] ?? null) : null,
                'delivery_address' => $fulfillment === Order::FULFILLMENT_DELIVERY ? ($payload['delivery_address'] ?? null) : null,
                'latitude' => $fulfillment === Order::FULFILLMENT_DELIVERY ? ($payload['latitude'] ?? null) : null,
                'longitude' => $fulfillment === Order::FULFILLMENT_DELIVERY ? ($payload['longitude'] ?? null) : null,
                'referring_affiliate_id' => $affiliate?->id,
                'payment_method' => $payload['payment_method'] ?? 'gcash',
                'status' => $isCod ? 'pending_payment' : 'paid', // COD: rider collects at delivery
            ]);

            // 2b. Pay with Suki Points for points-only items
            if ($pointsTotal > 0) {
                $this->loyalty->burn(
                    $customer,
                    $pointsTotal,
                    'points_purchase',
                    "Points purchase Order #{$order->id}",
                    $order,
                );
                $order->update(['payment_method' => 'points']);
            }

            // 2c. Pay with affiliate earnings (use_affiliate_balance)
            $totalDue = round((float) $productTotal + (float) $shippingAmount, 2);
            if (! empty($payload['use_affiliate_balance'])) {
                $affiliateWallet = $this->wallets->ensureWallet($customer->id, Wallet::TYPE_AFFILIATE_PAYOUT);
                $this->wallets->debit(
                    $affiliateWallet,
                    $totalDue,
                    "Marketplace purchase Order #{$order->id} paid with affiliate earnings",
                    'affiliate_purchase',
                    null,
                    $order,
                );
                $order->update(['payment_method' => 'affiliate', 'status' => 'paid']);
            }

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

                // Points-only items are redeemed with Suki Points — no cash
                // ledger split (merchant/platform/affiliate payouts skip).
                if ($product->points_only) {
                    continue;
                }

                // Customer: Suki Points (FR-MKT-002)
                if ($pointsAwarded > 0) {
                    $this->loyalty->award(
                        $customer, $pointsAwarded, 'purchase_reward',
                        "Purchase reward Order #{$order->id} — {$product->name}", $order,
                    );
                }
            }

            // 4. Release payouts via escrow — deferred for COD until the rider
            //    collects cash at delivery (Fix #1 + #3).
            if (! $isCod) {
                $this->releaseOrderPayouts($order);
            }

            // 5. Notify merchants of the new order (item 11)
            $merchantIds = $items->map(fn ($i) => $i->product->merchant_id)->unique()->values();
            $notifier = app(\App\Services\NotificationService::class);
            foreach ($merchantIds as $mid) {
                $notifier->merchantNewOrder($mid, $order->id);
            }

            // 6. Clear the cart
            CartItem::where('customer_id', $customer->id)->delete();

            return $order->load('items.product');
        });
    }

    /**
     * Release marketplace payouts through a sales-escrow wallet.
     *
     * Fix #3: the customer's payment is first credited to a `sales_escrow`
     * wallet ("money received"), then each split is TRANSFERRED out of escrow
     * to the merchant / platform / affiliate / admin / rider / hub wallets —
     * linking both sides of every movement for a full audit trail.
     *
     * Fix #1: COD orders skip this at checkout (cash not yet collected) and
     * call it once the rider marks the order delivered.
     */
    public function releaseOrderPayouts(Order $order): void
    {
        $totalDue = round((float) $order->total_amount + (float) $order->shipping_amount, 2);

        // Idempotent: only release once per order
        $released = \App\Models\LedgerTransaction::where('reference_type', Order::class)
            ->where('reference_id', $order->id)
            ->where('type', 'sales_receipt')
            ->exists();

        if ($released || $totalDue <= 0) {
            return;
        }

        $platformUserId = (int) config('bayanbox.ledger.platform_user_id', 1);
        $escrow = $this->wallets->ensureWallet($platformUserId, Wallet::TYPE_SALES_ESCROW);
        $platformWallet = $this->wallets->ensureWallet($platformUserId, Wallet::TYPE_PLATFORM_EARNINGS);

        // 1. Money received from the customer
        $this->wallets->credit(
            $escrow, $totalDue,
            "Customer payment received Order #{$order->id}",
            'sales_receipt', null, $order,
        );

        // 2. Disburse per product
        foreach ($order->items as $item) {
            $product = $item->product;
            if (! $product || $product->points_only) {
                continue;
            }

            $itemTotal = (float) $item->price_at_purchase * $item->quantity;
            $affiliatePayout = (float) $item->affiliate_payout_amount;

            if ($product->is_official_mall) {
                // BeCoolBox Mall: 100% to admin_earnings, 0% rake
                $adminPayout = round($itemTotal, 2) - $affiliatePayout;
                $adminWallet = $this->wallets->ensureWallet($platformUserId, Wallet::TYPE_ADMIN_EARNINGS);
                if ($adminPayout > 0) {
                    $this->wallets->transfer($escrow, $adminWallet, $adminPayout,
                        "BeCoolBox Mall sale Order #{$order->id} — {$product->name}",
                        'mall_sale', $order);
                }
            } else {
                // Merchant 90% (minus affiliate cut)
                $merchantPct = (float) config('bayanbox.marketplace.merchant_share_percent', 90.00);
                $merchantPayout = round($itemTotal * ($merchantPct / 100), 2) - $affiliatePayout;
                if ($merchantPayout > 0) {
                    $merchantWallet = $this->wallets->ensureWallet($product->merchant_id, Wallet::TYPE_MERCHANT_EARNINGS);
                    $this->wallets->transfer($escrow, $merchantWallet, $merchantPayout,
                        "Marketplace sale Order #{$order->id} — {$product->name}",
                        'marketplace_sale', $order);
                }

                // Platform 10% commission
                $platformPct = (float) config('bayanbox.marketplace.platform_commission_percent', 10.00);
                $this->wallets->transfer($escrow, $platformWallet, round($itemTotal * ($platformPct / 100), 2),
                    "Platform commission Order #{$order->id}",
                    'marketplace_commission', $order);
            }

            // Affiliate commission — held in escrow for the grace period
            // (FR-AFF-004). The affiliate wallet is credited only after
            // `affiliate:release-commissions` runs and the order was not
            // cancelled within commission_hold_hours.
            if ($affiliatePayout > 0 && $order->referring_affiliate_id) {
                $affiliate = User::find($order->referring_affiliate_id);
                if ($affiliate) {
                    $this->affiliate->holdCommission($order, $affiliate, $affiliatePayout);
                }
            }
        }

        // 3. Fulfillment split (from stored shipping_amount)
        if ($order->fulfillment_type === Order::FULFILLMENT_DELIVERY && $order->shipping_amount > 0) {
            $shipping = (float) $order->shipping_amount;
            $riderShare = round($shipping * 0.85, 2);
            $platformShare = round($shipping - $riderShare, 2);

            $riderWallet = $this->resolveRiderWallet();
            $riderWallet ??= $platformWallet;

            if ($riderShare > 0) {
                $this->wallets->transfer($escrow, $riderWallet, $riderShare,
                    $riderWallet->id === $platformWallet->id
                        ? "Unassigned rider delivery share Order #{$order->id}"
                        : "Rider delivery share Order #{$order->id}",
                    'delivery_split', $order);
            }
            if ($platformShare > 0) {
                $this->wallets->transfer($escrow, $platformWallet, $platformShare,
                    "Platform delivery share Order #{$order->id}",
                    'delivery_split', $order);
            }
        } elseif ($order->fulfillment_type === Order::FULFILLMENT_PICKUP && $order->shipping_amount > 0) {
            $handlingHalf = round((float) $order->shipping_amount / 2, 2);
            $hubStaffId = $order->hub_id ? optional(Hub::find($order->hub_id)->staff)->id : null;
            $hubWallet = $hubStaffId
                ? $this->wallets->ensureWallet($hubStaffId, Wallet::TYPE_MERCHANT_EARNINGS)
                : $platformWallet;

            $this->wallets->transfer($escrow, $hubWallet, $handlingHalf,
                $hubWallet->id === $platformWallet->id
                    ? "Unassigned hub handling fee Order #{$order->id}"
                    : "Click-and-collect handling fee Order #{$order->id}",
                'pickup_handling_fee', $order);

            $this->wallets->transfer($escrow, $platformWallet, $handlingHalf,
                "Click-and-collect handling fee Order #{$order->id}",
                'pickup_handling_fee', $order);
        }
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
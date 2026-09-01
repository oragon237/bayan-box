<?php

namespace Database\Seeders;

use App\Models\AdCampaign;
use App\Models\AffiliateCashOut;
use App\Models\Banner;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Comprehensive system-wide test data seeder.
 *
 * Run: php artisan db:seed --class=Database\\Seeders\\MasterSeeder
 * Default password for all accounts: Password123!
 */
class MasterSeeder extends Seeder
{
    protected string $passwordHash;

    protected array $users = [];

    protected array $merchants = [];

    protected array $riders = [];

    protected array $customers = [];

    protected array $affiliates = [];

    protected array $products = [];

    protected array $categories = ['Fresh Produce', 'Local Crafts', 'Packaging', 'Home Cooks', 'Points Shop', 'Provincial Goods'];

    public function run(): void
    {
        $this->passwordHash = Hash::make('Password123!');

        $this->command->info('Seeding Master test data…');

        DB::statement('SET session_replication_role = replica;'); // skip FK checks for speed

        try {
            // Clean previous master-seeded test data for a fresh state
            AdCampaign::query()->delete();
            Banner::query()->delete();
            Order::query()->delete();
            CartItem::query()->delete();
            AffiliateCashOut::query()->delete();
            ProductReview::query()->delete();
            Product::query()->delete();
            // Ledger + wallets are seeded too (affiliate income) — clear for idempotency
            \App\Models\LedgerTransaction::query()->delete();
            DB::table('wallets')->delete();

            $this->seedUsers();
            $this->seedCategories();
            $this->seedProducts();
            $this->seedReviews();
            $this->seedBanners();
            $this->seedProductAds();
            $this->seedCarts();
            $this->seedOrders();
            $this->seedAffiliates();
            $this->seedCashOuts();
            $this->seedWallets();
            $this->seedAffiliateIncome();
            $this->seedLoyalty();
        } finally {
            DB::statement('SET session_replication_role = origin;');
        }

        $this->printSummary();
    }

    protected function makeUser(array $attrs): User
    {
        $u = User::firstOrCreate(
            ['phone' => $attrs['phone']],
            array_merge([
                'email' => strtolower(Str::random(6)).'@becoolbox.com',
                'password_hash' => $this->passwordHash,
                'affiliate_code' => strtoupper(Str::random(8)),
                'municipality' => 'Santa Cruz',
                'barangay' => 'Poblacion',
                'status' => 'active',
            ], $attrs),
        );

        // Keep identity/contact/location fields in sync so re-seeding an
        // existing DB still applies profile changes (email, address, coords).
        $sync = array_intersect_key($attrs, array_flip([
            'email', 'name', 'role', 'status', 'barangay', 'municipality',
            'latitude', 'longitude', 'verified_at', 'affiliate_code',
            'is_official_mall', 'verification_notes',
        ]));
        if ($sync) {
            $u->update($sync);
        }

        return $u;
    }

    protected function seedUsers(): void
    {
        $this->users['admin'] = $this->makeUser(['name' => 'Admin', 'phone' => '09170000001', 'email' => 'admin@becoolbox.com', 'role' => 'admin', 'is_official_mall' => true, 'verified_at' => now()]);

        $this->users['staff'] = $this->makeUser(['name' => 'Nena Hub Staff', 'phone' => '09170000002', 'email' => 'staff@becoolbox.com', 'role' => 'staff']);

        // Merchants
        $this->merchants['m1'] = $this->makeUser([
            'name' => 'Mang Juan Store', 'phone' => '09170000004', 'email' => 'merchant1@becoolbox.com',
            'role' => 'merchant', 'status' => 'active', 'verified_at' => now(),
            'barangay' => 'Tara', 'municipality' => 'Sipocot, Camarines Sur',
            'latitude' => 13.7689, 'longitude' => 122.9764,
            'verification_notes' => json_encode(['dti_sec_number' => 'DTI-2026-0001', 'government_id_url' => null, 'business_permit_url' => null, 'submitted_at' => now()->toIso8601String()]),
        ]);
        $this->merchants['m2'] = $this->makeUser([
            'name' => 'Nena Sari-Sari', 'phone' => '09170000007', 'email' => 'merchant2@becoolbox.com',
            'role' => 'merchant', 'status' => 'pending_verification',
            'verification_notes' => json_encode(['dti_sec_number' => 'DTI-2026-0002', 'government_id_url' => null, 'submitted_at' => now()->toIso8601String()]),
        ]);

        // Riders
        $this->riders['r1'] = $this->makeUser(['name' => 'Rico the Rider', 'phone' => '09170000003', 'email' => 'rider1@becoolbox.com', 'role' => 'rider']);
        $this->riders['r2'] = $this->makeUser(['name' => 'Berto Rider', 'phone' => '09175550000', 'email' => 'rider2@becoolbox.com', 'role' => 'rider']);

        // Customers
        $this->customers['c1'] = $this->makeUser(['name' => 'Juan Dela Cruz', 'phone' => '09170000005', 'email' => 'customer1@becoolbox.com', 'role' => 'customer', 'barangay' => 'Tara', 'municipality' => 'Sipocot, Camarines Sur', 'latitude' => 13.7695, 'longitude' => 122.9771]);
        $this->customers['c2'] = $this->makeUser(['name' => 'Maria Clara', 'phone' => '09170000006', 'email' => 'customer2@becoolbox.com', 'role' => 'customer']);

        // Extra reviewers so products can have up to 5 unique reviews
        $this->customers['c3'] = $this->makeUser(['name' => 'Ramon Reviewer', 'phone' => '09170000010', 'email' => 'customer3@becoolbox.com', 'role' => 'customer']);
        $this->customers['c4'] = $this->makeUser(['name' => 'Liza Reviewer', 'phone' => '09170000011', 'email' => 'customer4@becoolbox.com', 'role' => 'customer']);
        $this->customers['c5'] = $this->makeUser(['name' => 'Tomas Reviewer', 'phone' => '09170000012', 'email' => 'customer5@becoolbox.com', 'role' => 'customer']);

        // Affiliates
        $this->affiliates['a1'] = $this->makeUser(['name' => 'Rosie Affiliate', 'phone' => '09170000008', 'email' => 'affiliate1@becoolbox.com', 'role' => 'customer', 'affiliate_code' => 'C7VV2NLA']);
        $this->affiliates['a2'] = $this->makeUser(['name' => 'Karding Affiliate', 'phone' => '09170000009', 'email' => 'affiliate2@becoolbox.com', 'role' => 'customer', 'affiliate_code' => 'KARD01']);
    }

    protected function seedCategories(): void
    {
        foreach ($this->categories as $cat) {
            DB::table('service_categories')->updateOrInsert(
                ['name' => $cat],
                ['base_pakyaw_rate' => 350, 'global_commission_percentage' => 10, 'created_at' => now(), 'updated_at' => now()],
            );
        }
    }

    protected function seedProducts(): void
    {
        $m1 = $this->merchants['m1']->id;
        $m2 = $this->merchants['m2']->id;
        $admin = $this->users['admin']->id;

        $data = [
            // [name, merchant, category, price, sale, stock, points_only, points_price, suki]
            ['Fresh Sili (250g)', $m1, 'Fresh Produce', 40, 32, 100, false, null, 2],
            ['Bicol Express Bagoong', $m1, 'Fresh Produce', 95, null, 45, false, null, 3],
            ['Ampalaya (1kg)', $m1, 'Fresh Produce', 60, 50, 4, false, null, 2],
            ['Kalamansi (500g)', $m1, 'Fresh Produce', 35, null, 80, false, null, 1],
            ['Gabi (1kg)', $m1, 'Fresh Produce', 55, null, 3, false, null, 2],
            ['Home-baked Pan de Sal', $m1, 'Home Cooks', 25, 20, 60, false, null, 1],
            ['Chicken Inasal Bento', $m1, 'Home Cooks', 120, 99, 30, false, null, 3],
            ['Halo-Halo Kit', $m1, 'Home Cooks', 85, null, 25, false, null, 2],
            ['Abaca Tote Bag', $m1, 'Local Crafts', 180, 150, 30, false, null, 5],
            ['Banig Mat (Twin)', $m1, 'Local Crafts', 450, null, 15, false, null, 8],
            ['Raffia Slippers', $m1, 'Local Crafts', 140, null, 40, false, null, 4],
            ['Handwoven Basket', $m1, 'Local Crafts', 320, 250, 12, false, null, 6],
            ['Coconut Shell Set', $m1, 'Local Crafts', 220, null, 20, false, null, 3],
            ['Bulk Bubble Wrap (50m)', $m1, 'Packaging', 350, null, 40, false, null, 8],
            ['Thermal Label Rolls', $m1, 'Packaging', 220, 180, 80, false, null, 5],
            ['Cardboard Mailers (x50)', $m1, 'Packaging', 480, null, 25, false, null, 10],
            ['HABI Sticker Pack', $m1, 'Packaging', 90, null, 5, false, null, 1],
            ['Pili Nuts (Official)', $admin, 'Provincial Goods', 145, 120, 60, false, null, 4],
            ['Bicol Chili Oil', $admin, 'Provincial Goods', 160, null, 35, false, null, 3],
            ['Provincial Honey (250g)', $admin, 'Provincial Goods', 280, 230, 20, false, null, 5],
            ['Coconut Vinegar (Sukang Sasa)', $admin, 'Provincial Goods', 75, null, 90, false, null, 2],
            ['Official HABI Tumbler', $admin, 'Points Shop', 0, null, 25, true, 300, 0],
            ['Suki Rewards Notebook', $admin, 'Points Shop', 0, null, 50, true, 120, 0],
            ['HABI Eco Tote (Points)', $admin, 'Points Shop', 0, null, 40, true, 200, 0],
            ['Fresh Mangoes (1kg)', $m2, 'Fresh Produce', 150, 130, 30, false, null, 4],
            ['Homemade Longganisa', $m2, 'Home Cooks', 180, null, 15, false, null, 3],
            ['Souvenir Keychains', $m2, 'Local Crafts', 50, null, 200, false, null, 1],
            ['Gift Wrapping Set', $m2, 'Packaging', 120, null, 60, false, null, 2],
        ];

        foreach ($data as [$name, $merchantId, $cat, $price, $sale, $stock, $pointsOnly, $pointsPrice, $suki]) {
            $p = Product::firstOrCreate(
                ['name' => $name],
                [
                    'merchant_id' => $merchantId,
                    'name' => $name,
                    'description' => "Fresh and locally sourced {$name} from Bicol.",
                    'price' => $price,
                    'sale_price' => $sale,
                    'stock' => $stock,
                    'points_price' => $pointsPrice,
                    'points_only' => $pointsOnly,
                    'suki_points_award' => $suki,
                    'affiliate_percentage' => $sale ? 8 : 0,
                    'image_url' => null,
                    'category' => $cat,
                    'status' => 'active',
                    'availability' => $stock > 0 ? 'available' : 'out_of_stock',
                    'is_official_mall' => $merchantId === $admin,
                ],
            );
            $this->products[] = $p;

            if ($p->is_official_mall) {
                ProductImage::firstOrCreate(
                    ['product_id' => $p->id, 'image_url' => 'https://placehold.co/600x400/673de6/ffffff?text='.urlencode($name)],
                    ['sort_order' => 0],
                );
            }
        }
    }

    protected function seedReviews(): void
    {
        $ratings = [5, 5, 4, 4, 3, 5, 3];
        $reviewers = ['c1', 'c2', 'c3', 'c4', 'c5'];

        foreach ($this->products as $i => $p) {
            $count = ($i % 5) + 1; // 1–5 reviews per product
            for ($j = 0; $j < $count; $j++) {
                $customer = $this->customers[$reviewers[$j]];
                ProductReview::firstOrCreate(
                    ['user_id' => $customer->id, 'product_id' => $p->id],
                    [
                        'rating' => $ratings[($i + $j) % count($ratings)],
                        'review' => 'Quality product, fast delivery. Recommended!',
                    ],
                );
            }
        }
    }

    protected function seedBanners(): void
    {
        $banners = [
            ['title' => 'Summer Sale 50% Off', 'image_url' => 'https://placehold.co/1200x400/673de6/ffffff?text=Summer+Sale', 'link_url' => '/search?on_sale=1', 'link_type' => 'internal', 'sort_order' => 0, 'is_active' => true],
            ['title' => 'Fresh Produce Week', 'image_url' => 'https://placehold.co/1200x400/22c55e/ffffff?text=Fresh+Produce', 'link_url' => '/search?category=Fresh+Produce', 'link_type' => 'internal', 'sort_order' => 1, 'is_active' => true],
            ['title' => 'Points Shop Launch', 'image_url' => 'https://placehold.co/1200x400/f59e0b/ffffff?text=Points+Shop', 'link_url' => '/points-shop', 'link_type' => 'internal', 'sort_order' => 2, 'is_active' => false],
        ];

        foreach ($banners as $b) {
            Banner::create($b);
        }
    }

    protected function seedProductAds(): void
    {
        $p = fn ($i) => $this->products[$i];

        // Home slide ads (via banners) already seeded above; create product ad campaigns
        AdCampaign::create(['product_id' => $p(0)->id, 'merchant_id' => $p(0)->merchant_id, 'ad_type' => 'sponsored', 'title' => 'Fresh Sili Sponsored', 'daily_rate' => 50, 'duration_days' => 7, 'total_cost' => 350, 'start_date' => now()->subDay(), 'end_date' => now()->addDays(6), 'display_order' => 1, 'keywords' => 'sili,chili,fresh', 'status' => 'active', 'payment_method' => 'wallet', 'impressions' => 1200, 'clicks' => 180, 'conversions' => 24]);
        AdCampaign::create(['product_id' => $p(8)->id, 'merchant_id' => $p(8)->merchant_id, 'ad_type' => 'sponsored', 'title' => 'Abaca Tote Ad', 'daily_rate' => 50, 'duration_days' => 5, 'total_cost' => 250, 'start_date' => now(), 'end_date' => now()->addDays(5), 'display_order' => 2, 'keywords' => 'abaca,tote,crafts', 'status' => 'active', 'payment_method' => 'points', 'impressions' => 800, 'clicks' => 95, 'conversions' => 10]);
        AdCampaign::create(['product_id' => $p(13)->id, 'merchant_id' => $p(13)->merchant_id, 'ad_type' => 'homepage_featured', 'title' => 'Bubble Wrap Featured', 'daily_rate' => 100, 'duration_days' => 3, 'total_cost' => 300, 'start_date' => now(), 'end_date' => now()->addDays(3), 'display_order' => 3, 'keywords' => 'packaging,bubble', 'status' => 'active', 'payment_method' => 'wallet', 'impressions' => 500, 'clicks' => 60, 'conversions' => 6]);
        AdCampaign::create(['product_id' => $p(1)->id, 'merchant_id' => $p(1)->merchant_id, 'ad_type' => 'flash_deal', 'title' => 'Bagoong Flash Deal', 'daily_rate' => 30, 'duration_days' => 7, 'total_cost' => 210, 'start_date' => now()->subDays(8), 'end_date' => now()->subDay(), 'display_order' => 4, 'keywords' => 'bagoong,bicol', 'status' => 'completed', 'payment_method' => 'wallet', 'impressions' => 900, 'clicks' => 120, 'conversions' => 15]);
    }

    protected function seedCarts(): void
    {
        CartItem::updateOrCreate(['customer_id' => $this->customers['c1']->id, 'product_id' => $this->products[0]->id], ['quantity' => 2]);
        CartItem::updateOrCreate(['customer_id' => $this->customers['c1']->id, 'product_id' => $this->products[5]->id], ['quantity' => 1]);
    }

    protected function seedOrders(): void
    {
        $c1 = $this->customers['c1']->id;
        $c2 = $this->customers['c2']->id;
        $r1 = $this->riders['r1']->id;
        $hubId = DB::table('hubs')->value('id') ?? 1;

        $orders = [
            ['customer' => $c1, 'status' => 'paid', 'fulfillment_status' => 'pending', 'delivery_state' => 'pending_merchant', 'fulfillment_type' => 'pickup', 'payment_method' => 'gcash', 'rider' => null, 'shipping' => 10],
            ['customer' => $c1, 'status' => 'assigned', 'fulfillment_status' => 'sending_to_courier', 'delivery_state' => 'raider_assigned', 'fulfillment_type' => 'delivery', 'payment_method' => 'cod', 'rider' => $r1, 'shipping' => 45],
            ['customer' => $c2, 'status' => 'out_for_delivery', 'fulfillment_status' => 'sending_to_courier', 'delivery_state' => 'in_transit', 'fulfillment_type' => 'delivery', 'payment_method' => 'gcash', 'rider' => $r1, 'shipping' => 38],
            ['customer' => $c1, 'status' => 'delivered', 'fulfillment_status' => 'accepted_by_courier', 'delivery_state' => 'delivered', 'fulfillment_type' => 'delivery', 'payment_method' => 'maya', 'rider' => $r1, 'shipping' => 30],
            ['customer' => $c2, 'status' => 'disputed', 'fulfillment_status' => 'pending', 'delivery_state' => 'delivered', 'fulfillment_type' => 'delivery', 'payment_method' => 'cod', 'rider' => null, 'shipping' => 42],
            ['customer' => $c1, 'status' => 'pending_payment', 'fulfillment_status' => 'pending', 'delivery_state' => 'pending_merchant', 'fulfillment_type' => 'pickup', 'payment_method' => 'cod', 'rider' => null, 'shipping' => 10],
        ];

        foreach ($orders as $i => $o) {
            $product = $this->products[$i % count($this->products)];
            $qty = ($i % 3) + 1;
            $total = $product->price * $qty;

            // Delivery origin (merchant) & destination (customer) coords so the
            // rider map shows the real store→home route per customer.
            $customer = $o['customer'] === $c1 ? $this->customers['c1'] : $this->customers['c2'];
            $destLat = $customer->latitude ?? 13.6218;
            $destLng = $customer->longitude ?? 123.1948;
            $merchant = $this->merchants['m1'];

            $order = Order::create([
                'customer_id' => $o['customer'],
                'total_amount' => round($total, 2),
                'shipping_amount' => $o['shipping'],
                'fulfillment_type' => $o['fulfillment_type'],
                'hub_id' => $o['fulfillment_type'] === 'pickup' ? $hubId : null,
                'rider_id' => $o['rider'],
                'delivery_address' => $o['fulfillment_type'] === 'delivery' ? "{$customer->barangay}, {$customer->municipality}" : null,
                'latitude' => $o['fulfillment_type'] === 'delivery' ? $destLat : null,
                'longitude' => $o['fulfillment_type'] === 'delivery' ? $destLng : null,
                'status' => $o['status'],
                'fulfillment_status' => $o['fulfillment_status'],
                'delivery_state' => $o['delivery_state'],
                'payment_method' => $o['payment_method'],
                'created_at' => now()->subDays(count($orders) - $i),
                'updated_at' => now()->subDays(count($orders) - $i),
            ]);

            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => $qty,
                'price_at_purchase' => $product->price,
                'suki_points_awarded' => $product->suki_points_award * $qty,
                'affiliate_payout_amount' => round($total * 0.05, 2),
            ]);
        }
    }

    protected function seedAffiliates(): void
    {
        // Activate dedicated affiliate users
        foreach ($this->affiliates as $a) {
            $a->update(['affiliate_status' => 'active', 'affiliate_activated_at' => now()]);
            $a->update(['affiliate_documents' => [['document_type' => 'government_id', 'id_url' => 'https://placehold.co/400x300/673de6/ffffff?text=ID', 'submitted_at' => now()->toIso8601String()]]]);
        }

        // Also activate the main demo users so they can see affiliate income
        foreach ([$this->customers['c1'], $this->riders['r1'], $this->merchants['m1']] as $u) {
            if ($u && ! $u->affiliate_status) {
                $u->update(['affiliate_status' => 'active', 'affiliate_activated_at' => now()]);
                $u->update(['affiliate_documents' => [['document_type' => 'government_id', 'id_url' => 'https://placehold.co/400x300/673de6/ffffff?text=ID', 'submitted_at' => now()->toIso8601String()]]]);
            }
        }
    }

    protected function seedCashOuts(): void
    {
        AffiliateCashOut::create(['user_id' => $this->affiliates['a1']->id, 'amount' => 250, 'status' => 'pending', 'requested_at' => now()->subHours(2)]);
        AffiliateCashOut::create(['user_id' => $this->affiliates['a2']->id, 'amount' => 180, 'status' => 'paid', 'requested_at' => now()->subDays(2), 'approved_at' => now()->subDay(), 'approved_by' => $this->users['admin']->id]);
        AffiliateCashOut::create(['user_id' => $this->affiliates['a1']->id, 'amount' => 100, 'status' => 'declined', 'requested_at' => now()->subDays(5), 'decline_reason' => 'Document invalid']);
    }

    protected function seedWallets(): void
    {
        $rows = [
            [$this->users['admin']->id, 'admin_earnings', 5000],
            [$this->users['admin']->id, 'platform_earnings', 2500],
            [$this->merchants['m1']->id, 'merchant_earnings', 1200],
            [$this->riders['r1']->id, 'rider_prepaid', 800],
            [$this->affiliates['a1']->id, 'affiliate_payout', 430],
            [$this->affiliates['a2']->id, 'affiliate_payout', 180],
            [$this->customers['c1']->id, 'affiliate_payout', 60],
        ];

        foreach ($rows as [$uid, $type, $bal]) {
            DB::table('wallets')->updateOrInsert(
                ['user_id' => $uid, 'wallet_type' => $type],
                ['balance' => $bal, 'currency' => 'PHP', 'created_at' => now(), 'updated_at' => now()],
            );
        }
    }

    /**
     * Seed affiliate income for the main demo accounts (customer, rider,
     * merchant) with a matching double-entry ledger trail so the affiliate
     * dashboard shows income sources + per-transaction history.
     */
    protected function seedAffiliateIncome(): void
    {
        $orders = Order::orderBy('id')->get();

        $plans = [
            // [user, base descriptions], amounts are derived from real orders
            [$this->customers['c1'], 'Affiliate reward Order #%d — %s', 'Affiliate micro-commission — parcel BB-2026-1000%d'],
            [$this->riders['r1'], 'Affiliate reward Order #%d — %s', 'Affiliate micro-commission — parcel BB-2026-1000%d'],
            [$this->merchants['m1'], 'Affiliate reward Order #%d — %s', 'Affiliate micro-commission — parcel BB-2026-1000%d'],
        ];

        foreach ($plans as $i => [$user, $orderFmt, $parcelFmt]) {
            if (! $user) {
                continue;
            }

            // Affiliate payout wallet
            $wallet = DB::table('wallets')->where('user_id', $user->id)->where('wallet_type', 'affiliate_payout')->first();
            $walletId = $wallet?->id;
            $balance = 0.00;

            if (! $walletId) {
                $walletId = DB::table('wallets')->insertGetId([
                    'user_id' => $user->id,
                    'wallet_type' => 'affiliate_payout',
                    'balance' => 0,
                    'currency' => 'PHP',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 2-3 marketplace commissions from real seeded orders
            $commissions = [
                ['order_index' => 0, 'amount' => 48.00, 'days_ago' => 9],
                ['order_index' => 1, 'amount' => 22.50, 'days_ago' => 6],
                ['order_index' => 2, 'amount' => 36.75, 'days_ago' => 2],
            ];

            foreach ($commissions as $k => $c) {
                $order = $orders->get($c['order_index']);
                $product = $order?->items()->first()?->product;
                $description = sprintf($orderFmt, $order?->id ?? ($k + 1), $product?->name ?? 'Product');
                $balance += $c['amount'];

                DB::table('ledger_transactions')->insert([
                    'wallet_id' => $walletId,
                    'counterparty_wallet_id' => null,
                    'amount' => $c['amount'],
                    'balance_after' => round($balance, 2),
                    'direction' => 'credit',
                    'type' => 'affiliate_commission',
                    'description' => $description,
                    'transaction_hash' => hash('sha256', "affiliate_seed_{$user->id}_{$k}_order"),
                    'reference_type' => $order ? \App\Models\Order::class : null,
                    'reference_id' => $order?->id,
                    'meta' => json_encode(['seeded' => true, 'source' => 'master_seed']),
                    'created_at' => now()->subDays($c['days_ago']),
                    'updated_at' => now()->subDays($c['days_ago']),
                ]);
            }

            // 2 parcel micro-commissions (FR-AFF-002)
            foreach ([14.00 => 5, 8.00 => 1] as $micro => $daysAgo) {
                $balance += $micro;
                DB::table('ledger_transactions')->insert([
                    'wallet_id' => $walletId,
                    'counterparty_wallet_id' => null,
                    'amount' => $micro,
                    'balance_after' => round($balance, 2),
                    'direction' => 'credit',
                    'type' => 'affiliate_commission',
                    'description' => sprintf($parcelFmt, $daysAgo + 1),
                    'transaction_hash' => hash('sha256', "affiliate_seed_{$user->id}_parcel_{$daysAgo}"),
                    'reference_type' => null,
                    'reference_id' => null,
                    'meta' => json_encode(['seeded' => true, 'source' => 'master_seed']),
                    'created_at' => now()->subDays($daysAgo),
                    'updated_at' => now()->subDays($daysAgo),
                ]);
            }

            // Wallet balance = sum of ledger credits
            DB::table('wallets')->where('id', $walletId)->update([
                'balance' => round($balance, 2),
                'updated_at' => now(),
            ]);
        }
    }

    protected function seedLoyalty(): void
    {
        $c1 = $this->customers['c1']->id;
        $c2 = $this->customers['c2']->id;

        foreach ([$c1 => 500, $c2 => 150] as $uid => $points) {
            DB::table('loyalty_points')->insert([
                'user_id' => $uid, 'points' => $points, 'type' => 'seed',
                'description' => 'Master seed welcome points', 'balance_after' => $points,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    protected function printSummary(): void
    {
        $this->command->newLine();
        $this->command->info('╔════════════════════════════════════════════════════════════╗');
        $this->command->info('║            HABI Master Seed Complete                     ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
        $this->command->newLine();

        $rows = [
            ['ADMIN', 'admin@becoolbox.com', '09170000001'],
            ['STAFF', 'staff@becoolbox.com', '09170000002'],
            ['MERCHANT (verified)', 'merchant1@becoolbox.com', '09170000004'],
            ['MERCHANT (pending)', 'merchant2@becoolbox.com', '09170000007'],
            ['RIDER', 'rider1@becoolbox.com', '09170000003'],
            ['CUSTOMER', 'customer1@becoolbox.com', '09170000005'],
            ['CUSTOMER', 'customer2@becoolbox.com', '09170000006'],
            ['AFFILIATE', 'affiliate1@becoolbox.com', '09170000008'],
        ];

        $this->command->table(
            ['Role', 'Email', 'Phone'],
            $rows,
        );

        $this->command->newLine();
        $this->command->info('Default password for ALL accounts: Password123!');
        $this->command->info('Products: '.Product::count().' | Orders: '.Order::count().' | Ad campaigns: '.AdCampaign::count().' | Banners: '.Banner::count().' | Cash-outs: '.AffiliateCashOut::count());
    }
}

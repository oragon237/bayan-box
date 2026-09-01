<?php

namespace Database\Seeders;

use App\Models\DeliveryRateSetting;
use App\Models\Hub;
use App\Models\PackagingItem;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $passwordHash = Hash::make('password');

        // -----------------------------------------------------------------
        // 1. Users (all six RBAC roles)
        // -----------------------------------------------------------------
        $users = [
            ['name' => 'HABI Admin', 'phone' => '09170000001', 'role' => 'admin'],
            ['name' => 'Nena Sari-Sari', 'phone' => '09170000002', 'role' => 'staff'],
            ['name' => 'Rico the Rider', 'phone' => '09170000003', 'role' => 'rider'],
            ['name' => 'Aling Maria Merch', 'phone' => '09170000004', 'role' => 'merchant'],
            ['name' => 'Juan Dela Cruz', 'phone' => '09170000005', 'role' => 'customer'],
            ['name' => 'Mang Cardo Pro', 'phone' => '09170000006', 'role' => 'provider'],
            ['name' => 'Ate Belen Aircon', 'phone' => '09170000007', 'role' => 'provider'],
            ['name' => 'Kuya Dom Plumber', 'phone' => '09170000008', 'role' => 'provider'],
            ['name' => 'Manong Ely Electrician', 'phone' => '09170000009', 'role' => 'provider'],
            ['name' => 'Nanay Imelda Handyman', 'phone' => '09170000010', 'role' => 'provider'],
        ];

        $created = [];
        foreach ($users as $i => $u) {
            $created[$u['role']] = User::firstOrCreate(
                ['phone' => $u['phone']],
                array_merge($u, [
                    'email' => strtolower($u['role']).$u['phone'].'@bayanbox.ph',
                    'password_hash' => $passwordHash,
                    'affiliate_code' => strtoupper(Str::random(8)),
                    'municipality' => 'Naga City',
                    'status' => 'active',
                ]),
            );
        }

        // -----------------------------------------------------------------
        // 1b. Skilled worker profiles (PRD 4.1 #4)
        // -----------------------------------------------------------------
        $providerSkills = [
            '09170000006' => ['General Handyman'],
            '09170000007' => ['Aircon Cleaning'],
            '09170000008' => ['Plumbing'],
            '09170000009' => ['Electrical Repair'],
            '09170000010' => ['General Handyman', 'Plumbing'],
        ];

        $providerUsers = User::where('role', 'provider')->get();
        foreach ($providerUsers as $provider) {
            $skills = $providerSkills[$provider->phone] ?? ['General Handyman'];
            ProviderProfile::firstOrCreate(
                ['user_id' => $provider->id],
                [
                    'is_verified' => true,
                    'verified_badge_assigned_at' => now(),
                    'skills' => $skills,
                    'custom_rate_enabled' => false,
                    'verification_expiry' => now()->addYear(),
                ],
            );
        }

        // -----------------------------------------------------------------
        // 2. Hubs (referral codes for FR-AFF-001)
        // -----------------------------------------------------------------
        $hub = Hub::firstOrCreate(
            ['name' => 'Nena San Jose Sari-Sari'],
            [
                'address' => 'Block 12, San Jose, Naga City',
                'barangay' => 'San Jose',
                'municipality' => 'Naga City',
                'latitude' => 13.6288,
                'longitude' => 123.1860,
                'staff_id' => $created['staff']->id,
                'capacity_limit' => 500,
                'referral_code' => 'NENA01',
            ],
        );

        // -----------------------------------------------------------------
        // 3. Delivery rate settings (FR-CALC-003..005)
        // -----------------------------------------------------------------
        foreach ([
            ['municipality_name' => 'Naga City', 'base_fare' => 35.00, 'base_distance_km' => 2.00, 'per_km_rate' => 10.00],
            ['municipality_name' => 'Iriga City', 'base_fare' => 40.00, 'base_distance_km' => 2.00, 'per_km_rate' => 12.00],
            ['municipality_name' => 'Bula', 'base_fare' => 30.00, 'base_distance_km' => 3.00, 'per_km_rate' => 11.00],
            ['municipality_name' => 'Pili', 'base_fare' => 35.00, 'base_distance_km' => 2.50, 'per_km_rate' => 12.00],
        ] as $rate) {
            DeliveryRateSetting::firstOrCreate(['municipality_name' => $rate['municipality_name']], $rate);
        }

        // -----------------------------------------------------------------
        // 4. Service categories (PRD 4.1 #5)
        // -----------------------------------------------------------------
        foreach ([
            ['name' => 'Aircon Cleaning', 'base_pakyaw_rate' => 900.00, 'global_commission_percentage' => 15.00],
            ['name' => 'Plumbing', 'base_pakyaw_rate' => 500.00, 'global_commission_percentage' => 15.00],
            ['name' => 'Electrical Repair', 'base_pakyaw_rate' => 450.00, 'global_commission_percentage' => 15.00],
            ['name' => 'General Handyman', 'base_pakyaw_rate' => 350.00, 'global_commission_percentage' => 10.00],
        ] as $cat) {
            ServiceCategory::firstOrCreate(['name' => $cat['name']], $cat);
        }

        // -----------------------------------------------------------------
        // 5. Packaging marketplace (FR-LOY-003)
        // -----------------------------------------------------------------
        foreach ([
            ['name' => 'Thermal Paper Roll', 'sku' => 'PKG-TPR-001', 'cash_price' => 120.00, 'points_price' => 100, 'stock_qty' => 500],
            ['name' => 'Bubble Wrap 50m', 'sku' => 'PKG-BW-002', 'cash_price' => 250.00, 'points_price' => 200, 'stock_qty' => 300],
            ['name' => 'Mailer Box Medium', 'sku' => 'PKG-MB-003', 'cash_price' => 35.00, 'points_price' => 30, 'stock_qty' => 2000],
            ['name' => 'Thermal Label 100pcs', 'sku' => 'PKG-TL-004', 'cash_price' => 80.00, 'points_price' => 70, 'stock_qty' => 800],
        ] as $item) {
            PackagingItem::firstOrCreate(['sku' => $item['sku']], $item);
        }

        // -----------------------------------------------------------------
        // 6. Geo-targeted promo (FR-PROMO-001)
        // -----------------------------------------------------------------
        DB::table('promo_codes')->updateOrInsert(
            ['code' => 'NenaSanJose'],
            [
                'description' => '₱20 off when picking up at San Jose hub',
                'discount_type' => 'flat',
                'discount_value' => 20.00,
                'min_transaction_amount' => 0.00,
                'hub_id' => $hub->id,
                'barangay' => 'San Jose',
                'municipality' => 'Naga City',
                'min_parcels_per_transaction' => 1,
                'max_uses' => 0,
                'used_count' => 0,
                'is_active' => true,
                'created_by' => $created['admin']->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        DB::table('promo_codes')->updateOrInsert(
            ['code' => '3PARCELSGET20'],
            [
                'description' => '₱20 flat discount for 3+ parcels in one pickup',
                'discount_type' => 'flat',
                'discount_value' => 20.00,
                'min_transaction_amount' => 0.00,
                'min_parcels_per_transaction' => 3,
                'max_uses' => 0,
                'used_count' => 0,
                'is_active' => true,
                'created_by' => $created['admin']->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );

        // -----------------------------------------------------------------
        // 7. Demo wallet + Suki points (FR-LOY)
        // -----------------------------------------------------------------
        DB::table('wallets')->updateOrInsert(
            ['user_id' => $created['rider']->id, 'wallet_type' => 'rider_prepaid'],
            ['balance' => 500.00, 'currency' => 'PHP', 'created_at' => now(), 'updated_at' => now()],
        );

        DB::table('loyalty_points')->insert([
            'user_id' => $created['customer']->id,
            'points' => 150,
            'type' => 'seed',
            'description' => 'Welcome Suki points',
            'balance_after' => 150,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // -----------------------------------------------------------------
        // 8. Marketplace demo products (FR-MKT-001)
        // -----------------------------------------------------------------
        foreach ([
            ['name' => 'Fresh Sili (250g)', 'category' => 'Fresh Produce', 'price' => 40.00, 'stock' => 100, 'suki_points_award' => 2, 'affiliate_percentage' => 5.00],
            ['name' => 'Home-baked Pan de Sal', 'category' => 'Home Cooks', 'price' => 25.00, 'stock' => 60, 'suki_points_award' => 1, 'affiliate_percentage' => 3.00],
            ['name' => 'Abaca Tote Bag', 'category' => 'Local Crafts', 'price' => 180.00, 'stock' => 30, 'suki_points_award' => 5, 'affiliate_percentage' => 10.00],
            ['name' => 'Bicol Express Bagoong', 'category' => 'Fresh Produce', 'price' => 95.00, 'stock' => 45, 'suki_points_award' => 3, 'affiliate_percentage' => 0.00],
        ] as $product) {
            \App\Models\Product::firstOrCreate(
                ['name' => $product['name']],
                array_merge($product, [
                    'merchant_id' => $created['merchant']->id,
                    'description' => "Local {$product['category']} item from {$created['merchant']->name}.",
                    'image_url' => null,
                    'status' => 'active',
                ]),
            );
        }

        // -----------------------------------------------------------------
        // 9. HABI Mall (Module 2) — mark admin as flagship store
        // -----------------------------------------------------------------
        $admin = $created['admin'];
        $admin->update([
            'is_official_mall' => true,
            'verified_at' => now(),
            'status' => 'active',
        ]);

        foreach ([
            ['name' => 'Bulk Bubble Wrap (50m)', 'category' => 'Packaging', 'price' => 350.00, 'stock' => 40, 'suki_points_award' => 8, 'affiliate_percentage' => 3.00],
            ['name' => 'Thermal Label Rolls (x100)', 'category' => 'Packaging', 'price' => 220.00, 'stock' => 80, 'suki_points_award' => 5, 'affiliate_percentage' => 0.00],
            ['name' => 'Cardboard Mailers (x50)', 'category' => 'Packaging', 'price' => 480.00, 'stock' => 25, 'suki_points_award' => 10, 'affiliate_percentage' => 5.00],
            ['name' => 'Bicol Pili Nuts (Official)', 'category' => 'Provincial Goods', 'price' => 145.00, 'stock' => 60, 'suki_points_award' => 4, 'affiliate_percentage' => 8.00],
        ] as $mallProduct) {
            \App\Models\Product::firstOrCreate(
                ['name' => $mallProduct['name']],
                array_merge($mallProduct, [
                    'merchant_id' => $admin->id,
                    'description' => "Official HABI Mall item — {$mallProduct['name']}.",
                    'image_url' => null,
                    'status' => 'active',
                    'is_official_mall' => true,
                ]),
            );
        }

        // Provision an admin_earnings wallet for mall sales
        DB::table('wallets')->updateOrInsert(
            ['user_id' => $admin->id, 'wallet_type' => 'admin_earnings'],
            ['balance' => 0.00, 'currency' => 'PHP', 'created_at' => now(), 'updated_at' => now()],
        );

        $this->command->info('HABI demo data seeded.');
    }
}
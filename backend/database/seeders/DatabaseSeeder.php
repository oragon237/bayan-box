<?php

namespace Database\Seeders;

use App\Models\DeliveryRateSetting;
use App\Models\Hub;
use App\Models\PackagingItem;
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
            ['name' => 'BayanBox Admin', 'phone' => '09170000001', 'role' => 'admin'],
            ['name' => 'Nena Sari-Sari', 'phone' => '09170000002', 'role' => 'staff'],
            ['name' => 'Rico the Rider', 'phone' => '09170000003', 'role' => 'rider'],
            ['name' => 'Aling Maria Merch', 'phone' => '09170000004', 'role' => 'merchant'],
            ['name' => 'Juan Dela Cruz', 'phone' => '09170000005', 'role' => 'customer'],
            ['name' => 'Mang Cardo Pro', 'phone' => '09170000006', 'role' => 'provider'],
        ];

        $created = [];
        foreach ($users as $i => $u) {
            $created[$u['role']] = User::firstOrCreate(
                ['phone' => $u['phone']],
                array_merge($u, [
                    'email' => strtolower($u['role']).'@bayanbox.ph',
                    'password_hash' => $passwordHash,
                    'affiliate_code' => strtoupper(Str::random(8)),
                    'municipality' => 'Naga City',
                    'status' => 'active',
                ]),
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

        $this->command->info('BayanBox demo data seeded.');
    }
}
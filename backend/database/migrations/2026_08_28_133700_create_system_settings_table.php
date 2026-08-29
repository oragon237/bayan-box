<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Key-value system settings storage for fees, rates, toggles, locations.
     */
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        // Seed defaults
        $settings = [
            'fees' => ['base_fee' => 40.00, 'base_distance_km' => 2.0, 'per_km_rate' => 10.00, 'merchant_commission_percent' => 5.00, 'min_cashout' => 500.00],
            'ads' => ['homepage_featured_rate' => 100.00, 'sponsored_rate' => 50.00, 'max_featured_slots' => 5],
            'toggles' => ['maintenance_mode' => false, 'allow_merchant_registration' => true],
            'locations' => ['default_lat' => 13.6218, 'default_lng' => 123.1948, 'service_zones' => [
                ['name' => 'Naga City', 'barangays' => ['San Jose', 'Poblacion', 'Sta. Cruz'], 'active' => true],
                ['name' => 'Iriga City', 'barangays' => ['San Vicente', 'Sta. Teresita'], 'active' => true],
            ]],
        ];

        foreach ($settings as $key => $value) {
            DB::table('system_settings')->insert(['key' => $key, 'value' => json_encode($value), 'created_at' => now(), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-municipality dynamic rate configuration — PRD 4.1 #6 (FR-CALC-003/004/005/006).
     */
    public function up(): void
    {
        Schema::create('delivery_rate_settings', function (Blueprint $table) {
            $table->id();
            $table->string('municipality_name', 100)->unique()->notNull();
            $table->decimal('base_fare', 10, 2)->default(35.00);
            $table->decimal('base_distance_km', 5, 2)->default(2.00);
            $table->decimal('per_km_rate', 10, 2)->default(10.00);
            $table->decimal('platform_percentage', 5, 2)->default(15.00);
            $table->decimal('rider_percentage', 5, 2)->default(85.00);
            $table->decimal('surge_multiplier', 3, 2)->default(1.00);
            $table->boolean('surge_override_active')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_rate_settings');
    }
};

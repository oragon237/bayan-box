<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Promo redemption ledger — FR-PROMO-003 (max-uses enforcement + audit).
     */
    public function up(): void
    {
        Schema::create('promo_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promo_code_id')->constrained('promo_codes')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('parcel_id')->nullable()->constrained('parcels')->nullOnDelete();
            $table->decimal('discounted_amount', 10, 2)->default(0.00);
            $table->string('reference', 60)->nullable();
            $table->timestamps();

            $table->unique(['promo_code_id', 'user_id', 'parcel_id'], 'promo_redemption_once');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_redemptions');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Wallets — PRD 4.1 #9. One wallet per (user, type).
     * Types: rider_prepaid, merchant_earnings, affiliate_payout,
     * provider_earnings, platform_earnings.
     */
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('wallet_type', 30)->notNull();
            $table->decimal('balance', 12, 2)->default(0.00);
            $table->string('currency', 3)->default('PHP');
            $table->timestamps();

            $table->unique(['user_id', 'wallet_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};

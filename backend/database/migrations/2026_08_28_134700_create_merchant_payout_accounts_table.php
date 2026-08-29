<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Merchant payout accounts (GCash / Maya / Bank) + cash-out payout linkage.
     */
    public function up(): void
    {
        Schema::create('merchant_payout_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('account_type', 20); // gcash | maya | bank
            $table->string('account_name', 120);
            $table->string('mobile_number', 20)->nullable(); // gcash/maya
            $table->string('bank_name', 60)->nullable(); // bank
            $table->string('account_number', 40)->nullable(); // bank
            $table->string('branch', 120)->nullable(); // bank optional
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'account_type']);
        });

        // Link cash-outs to payout accounts + capture transfer reference
        Schema::table('affiliate_cash_outs', function (Blueprint $table) {
            $table->foreignId('payout_account_id')->nullable()->constrained('merchant_payout_accounts')->nullOnDelete()->after('wallet_type');
            $table->string('payout_reference', 60)->nullable()->after('decline_reason');
        });
    }

    public function down(): void
    {
        Schema::table('affiliate_cash_outs', function (Blueprint $table) {
            $table->dropForeign(['payout_account_id']);
            $table->dropColumn(['payout_account_id', 'payout_reference']);
        });

        Schema::dropIfExists('merchant_payout_accounts');
    }
};
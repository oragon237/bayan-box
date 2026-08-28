<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Generalize cash-outs to support merchant wallet withdrawals too.
     */
    public function up(): void
    {
        Schema::table('affiliate_cash_outs', function (Blueprint $table) {
            $table->string('wallet_type', 30)->default('affiliate_payout')->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('affiliate_cash_outs', function (Blueprint $table) {
            $table->dropColumn('wallet_type');
        });
    }
};
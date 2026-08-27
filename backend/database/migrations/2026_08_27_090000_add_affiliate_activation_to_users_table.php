<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Affiliate activation (item 12): affiliates earn regardless, but can only
     * withdraw once activated by admin after submitting requirements (ID).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('affiliate_status', 20)->default('pending')->after('affiliate_code'); // pending | active
            $table->json('affiliate_documents')->nullable()->after('affiliate_status');
            $table->timestamp('affiliate_activated_at')->nullable()->after('affiliate_documents');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['affiliate_activated_at', 'affiliate_documents', 'affiliate_status']);
        });
    }
};
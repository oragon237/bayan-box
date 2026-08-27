<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Merchant fulfillment status for orders (accepted → packaging →
     * sending_to_courier → accepted_by_courier).
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('fulfillment_status', 30)->default('pending')->after('status');
            $table->index('fulfillment_status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['fulfillment_status']);
            $table->dropColumn('fulfillment_status');
        });
    }
};
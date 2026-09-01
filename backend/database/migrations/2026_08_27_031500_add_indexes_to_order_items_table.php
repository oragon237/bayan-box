<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add FK indexes on the growing order_items history table (PostgreSQL does
     * not auto-index foreign-key columns).
     */
    public function up(): void
    {
        if (! Schema::hasIndex('order_items', 'order_items_order_id_index')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->index('order_id');
            });
        }
        if (! Schema::hasIndex('order_items', 'order_items_product_id_index')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->index('product_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id']);
            $table->dropIndex(['product_id']);
        });
    }
};
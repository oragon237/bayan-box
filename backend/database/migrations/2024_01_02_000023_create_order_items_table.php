<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Order items (purchase receipt breakdown) — PRD v4 §4.1 #13.
     *
     * Locks in price_at_purchase so the merchant cannot change the price
     * after the order is placed. Tracks awarded Suki points and affiliate
     * payout per product.
     */
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->integer('quantity')->default(1);
            $table->decimal('price_at_purchase', 10, 2)->notNull();
            $table->integer('suki_points_awarded')->default(0);
            $table->decimal('affiliate_payout_amount', 10, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
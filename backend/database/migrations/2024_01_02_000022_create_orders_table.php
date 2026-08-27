<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * E-Commerce purchase orders — PRD v4 §4.1 #12 (FR-MKT-006).
     *
     * Supports click-and-collect (pickup) or doorstep delivery with dynamic
     * shipping fee, affiliate attribution, and full audit trail.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('total_amount', 12, 2)->default(0.00); // sum of product costs
            $table->decimal('shipping_amount', 10, 2)->default(0.00);
            $table->string('fulfillment_type', 20)->notNull(); // pickup | delivery
            $table->foreignId('hub_id')->nullable()->constrained('hubs')->nullOnDelete(); // dest hub if pickup
            $table->foreignId('rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('delivery_address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('status', 30)->default('pending'); // pending, paid, out_for_delivery, completed, cancelled
            $table->foreignId('referring_affiliate_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
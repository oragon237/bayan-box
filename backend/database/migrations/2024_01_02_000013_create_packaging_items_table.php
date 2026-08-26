<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * B2B Packaging Marketplace catalog — FR-LOY-003.
     * Merchants redeem loyalty points for physical packing supplies.
     */
    public function up(): void
    {
        Schema::create('packaging_items', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->notNull();
            $table->string('sku', 40)->unique()->notNull();
            $table->text('description')->nullable();
            $table->decimal('cash_price', 10, 2)->default(0.00);
            $table->integer('points_price')->default(0);
            $table->integer('stock_qty')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packaging_items');
    }
};

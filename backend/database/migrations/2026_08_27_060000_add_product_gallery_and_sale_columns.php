<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Product gallery + sale/availability fields (Phase A).
     *
     * product_images: ordered gallery of uploaded images per product.
     * products:       sale_price (discount), availability (available |
     *                 out_of_stock | unavailable).
     */
    public function up(): void
    {
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('image_url', 255);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->index('product_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('sale_price', 10, 2)->nullable()->after('price');
            $table->string('availability', 20)->default('available')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['sale_price', 'availability']);
        });

        Schema::dropIfExists('product_images');
    }
};
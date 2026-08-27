<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Local marketplace products — PRD v4 §4.1 #10 (FR-MKT-001..003).
     *
     * Merchant-owned catalog items with per-product Suki Points awards and
     * custom affiliate referral percentages.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 150)->notNull();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->notNull();
            $table->integer('stock')->default(0);
            $table->integer('suki_points_award')->default(0); // FR-MKT-002
            $table->decimal('affiliate_percentage', 5, 2)->default(0.00); // FR-MKT-003 (0–50%)
            $table->string('image_url', 255)->nullable();
            $table->string('category', 50)->default('General'); // Fresh Produce, Home Cooks, Local Crafts
            $table->string('status', 20)->default('active'); // active | archived
            $table->timestamps();

            $table->index(['status', 'category']);
            $table->index(['merchant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
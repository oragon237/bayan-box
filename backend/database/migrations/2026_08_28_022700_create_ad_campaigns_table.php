<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Merchant ad campaigns (sponsored / homepage featured / flash deal).
     */
    public function up(): void
    {
        Schema::create('ad_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('merchant_id')->constrained('users')->cascadeOnDelete();
            $table->string('ad_type', 20); // sponsored | homepage_featured | flash_deal
            $table->decimal('daily_rate', 10, 2);
            $table->integer('duration_days')->default(1);
            $table->decimal('total_cost', 10, 2);
            $table->timestamp('start_date');
            $table->timestamp('end_date');
            $table->string('status', 20)->default('scheduled'); // scheduled | active | paused | completed
            $table->string('payment_method', 20)->default('wallet'); // wallet | points
            $table->integer('impressions')->default(0);
            $table->integer('clicks')->default(0);
            $table->integer('conversions')->default(0);
            $table->timestamps();

            $table->index(['status', 'end_date']);
            $table->index(['merchant_id']);
            $table->index(['product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ad_campaigns');
    }
};
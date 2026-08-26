<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Packaging marketplace redemption ledger.
     */
    public function up(): void
    {
        Schema::create('packaging_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('packaging_item_id')->constrained('packaging_items');
            $table->integer('quantity')->default(1);
            $table->integer('points_spent')->notNull();
            $table->string('status', 20)->default('processing'); // processing | fulfilled | cancelled
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('packaging_redemptions');
    }
};

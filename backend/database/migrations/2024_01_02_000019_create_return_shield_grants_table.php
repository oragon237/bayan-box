<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * FR-AFF-003: Return Shield credits granted to referring merchants.
     */
    public function up(): void
    {
        Schema::create('return_shield_grants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('discount_percent', 5, 2)->default(50.00);
            $table->timestamp('starts_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique('merchant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_shield_grants');
    }
};

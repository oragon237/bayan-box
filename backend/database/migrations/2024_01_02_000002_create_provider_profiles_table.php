<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Verified professional providers (skilled workers) — PRD 4.1 #4.
     */
    public function up(): void
    {
        Schema::create('provider_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_badge_assigned_at')->nullable();
            $table->json('skills')->nullable(); // array of services provided
            $table->boolean('custom_rate_enabled')->default(false);
            $table->decimal('custom_commission_override', 5, 2)->nullable();
            $table->timestamp('verification_expiry')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_profiles');
    }
};

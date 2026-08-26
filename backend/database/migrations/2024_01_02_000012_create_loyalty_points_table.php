<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Suki Points ledger — FR-LOY-001 (real-time ledger, NOT a flat balance).
     * Every event writes a signed row; balance is derived by SUM(points).
     */
    public function up(): void
    {
        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->integer('points')->notNull(); // signed: + earn, - burn
            $table->string('type', 40)->index();  // pickup_reward, return_dropoff, doorstep_upgrade, packaging_redemption
            $table->string('description', 255)->notNull();
            $table->nullableMorphs('reference');
            $table->integer('balance_after')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_points');
    }
};

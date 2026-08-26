<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Customer/sender addresses with geocoded coordinates for the dynamic
     * per-km calculator and geofenced promos.
     */
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('label', 50)->default('Home');
            $table->text('full_address')->notNull();
            $table->string('barangay', 100)->index();
            $table->string('municipality', 100)->index();
            $table->string('province', 100)->nullable();
            $table->decimal('latitude', 10, 8)->notNull();
            $table->decimal('longitude', 11, 8)->notNull();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};

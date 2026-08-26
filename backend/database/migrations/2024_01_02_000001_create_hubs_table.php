<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Local parcel hubs (sari-sari stores, pharmacies) — PRD 4.1 #3.
     */
    public function up(): void
    {
        Schema::create('hubs', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->notNull();
            $table->text('address')->notNull();
            $table->string('barangay', 100)->nullable()->index();
            $table->string('municipality', 100)->nullable()->index();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->foreignId('staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('capacity_limit')->default(500);
            $table->integer('current_parcel_count')->default(0);
            $table->string('referral_code', 15)->nullable()->unique();
            $table->timestamps();

            // Geofenced lookup: find hubs near a coordinate (FR-PROMO-001)
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hubs');
    }
};

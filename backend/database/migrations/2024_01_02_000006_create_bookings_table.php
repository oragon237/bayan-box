<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Skilled-services bookings — PRD 4.1 #8. Bundled rate/commission/payout
     * snapshot so a completed booking always settles the exact quoted numbers.
     */
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('service_id')->constrained('service_categories');
            $table->string('status', 20)->default('pending')->index();
            $table->timestamp('booking_date')->notNull();
            $table->text('address')->notNull();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            $table->decimal('quoted_amount', 10, 2)->notNull();
            $table->decimal('platform_commission', 10, 2)->notNull();
            $table->decimal('provider_payout', 10, 2)->notNull();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};

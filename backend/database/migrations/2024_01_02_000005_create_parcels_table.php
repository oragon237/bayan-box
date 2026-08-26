<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Parcels — PRD 4.1 #7. Core shipment record with OTP, COD, delivery
     * metrics and pickup-reward timestamps for the Suki Points engine.
     */
    public function up(): void
    {
        Schema::create('parcels', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_number', 100)->unique()->notNull();
            $table->string('shipper_name', 100)->nullable();
            $table->string('recipient_name', 100)->notNull();
            $table->string('recipient_phone', 20)->notNull();
            $table->foreignId('hub_id')->constrained('hubs')->restrictOnDelete();
            $table->foreignId('rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('received_at_hub')->index();
            $table->string('otp_code', 6)->notNull();
            $table->timestamp('otp_expires_at')->nullable();
            $table->integer('otp_attempts')->default(0);
            $table->decimal('cod_amount', 10, 2)->default(0.00);

            $table->string('origin_address', 255)->nullable();
            $table->decimal('origin_latitude', 10, 8)->nullable();
            $table->decimal('origin_longitude', 11, 8)->nullable();
            $table->string('destination_address', 255)->nullable();
            $table->decimal('destination_latitude', 10, 8)->nullable();
            $table->decimal('destination_longitude', 11, 8)->nullable();
            $table->string('destination_barangay', 100)->nullable();

            $table->decimal('delivery_distance_km', 6, 2)->default(0.00);
            $table->decimal('calculated_delivery_fee', 10, 2)->default(0.00);
            $table->decimal('applied_surge', 3, 2)->default(1.00);

            $table->timestamp('arrived_at_hub_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->foreignId('referred_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('referral_commission_paid_at')->nullable();

            $table->timestamps();

            $table->index(['hub_id', 'status']);
            $table->index(['destination_barangay', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcels');
    }
};

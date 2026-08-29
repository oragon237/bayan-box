<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Multi-party order lifecycle state machine.
     *
     * Adds a `delivery_state` column driving the PENDING_MERCHANT →
     * … → DELIVERED/CANCELLED flow, plus proof-of-delivery fields
     * (delivery_pin + photo) and exception timestamps.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('delivery_state', 30)->default('pending_merchant')->after('fulfillment_status');
            $table->string('delivery_pin', 8)->nullable()->after('delivery_state');
            $table->string('delivery_photo_url', 255)->nullable()->after('delivery_pin');
            $table->timestamp('accepted_at')->nullable()->after('delivery_photo_url');
            $table->timestamp('ready_at')->nullable()->after('accepted_at');
            $table->timestamp('rider_pickup_at')->nullable()->after('ready_at');
            $table->string('cancel_reason', 255)->nullable()->after('rider_pickup_at');
            $table->index('delivery_state');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['delivery_state']);
            $table->dropColumn([
                'delivery_state', 'delivery_pin', 'delivery_photo_url',
                'accepted_at', 'ready_at', 'rider_pickup_at', 'cancel_reason',
            ]);
        });
    }
};
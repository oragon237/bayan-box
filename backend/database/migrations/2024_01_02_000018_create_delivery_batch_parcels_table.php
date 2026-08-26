<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pivot: batch ↔ parcels.
     */
    public function up(): void
    {
        Schema::create('delivery_batch_parcels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('delivery_batch_id')->constrained('delivery_batches')->cascadeOnDelete();
            $table->foreignId('parcel_id')->constrained('parcels')->cascadeOnDelete();
            $table->integer('sequence')->default(0);
            $table->string('dropoff_status', 20)->default('pending'); // pending | delivered | returned | failed
            $table->string('proof_photo_path', 255)->nullable();
            $table->timestamps();

            $table->unique(['delivery_batch_id', 'parcel_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_batch_parcels');
    }
};

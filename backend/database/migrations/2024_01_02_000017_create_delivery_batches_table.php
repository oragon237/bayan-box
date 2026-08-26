<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Batch delivery routes — grouped by barangay cluster (PRD 2.3).
     */
    public function up(): void
    {
        Schema::create('delivery_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_code', 40)->unique()->notNull();
            $table->foreignId('hub_id')->constrained('hubs');
            $table->foreignId('rider_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('barangay', 100)->nullable()->index();
            $table->string('status', 20)->default('pending'); // pending | assigned | in_transit | completed
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_batches');
    }
};

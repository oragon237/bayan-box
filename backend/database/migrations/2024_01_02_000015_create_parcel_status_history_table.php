<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Parcel status history — audit trail powering the customer tracking
     * timeline and reconciliation reports.
     */
    public function up(): void
    {
        Schema::create('parcel_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parcel_id')->constrained('parcels')->cascadeOnDelete();
            $table->string('status', 30)->notNull();
            $table->string('note', 255)->nullable();
            $table->foreignId('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();

            $table->index(['parcel_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcel_status_history');
    }
};

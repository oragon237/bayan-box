<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rider GPS telemetry — FR-MAP-002.
     * Client pushes a new row only when movement exceeds 50m; backend keeps
     * the latest fix per rider for the tracking map. Geofenced composite index.
     */
    public function up(): void
    {
        Schema::create('rider_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rider_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('latitude', 10, 8)->notNull();
            $table->decimal('longitude', 11, 8)->notNull();
            $table->float('accuracy_m')->default(0);
            $table->float('speed_mps')->nullable();
            $table->float('heading_deg')->nullable();
            $table->timestamp('recorded_at')->useCurrent();

            $table->index(['rider_id', 'recorded_at']);
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rider_locations');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Geo-targeted promo codes — FR-PROMO-001..003.
     *
     * A promo can be scoped to one hub (destination hub), one barangay,
     * or be global. Volume rules (e.g. 3PARCELSGET20) and strict caps are
     * enforced by PromoService.
     */
    public function up(): void
    {
        Schema::create('promo_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique()->notNull();
            $table->string('description', 255)->nullable();
            $table->enum('discount_type', ['flat', 'percent', 'free_delivery'])->default('flat');
            $table->decimal('discount_value', 10, 2)->default(0.00);
            $table->decimal('min_transaction_amount', 10, 2)->default(0.00);

            // Geo-scope
            $table->foreignId('hub_id')->nullable()->constrained('hubs')->cascadeOnDelete();
            $table->string('barangay', 100)->nullable()->index();
            $table->string('municipality', 100)->nullable()->index();

            // Volume / consolidation rules (FR-PROMO-002)
            $table->integer('min_parcels_per_transaction')->default(1);

            // Strict controls (FR-PROMO-003)
            $table->integer('max_uses')->default(0); // 0 = unlimited
            $table->integer('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promo_codes');
    }
};

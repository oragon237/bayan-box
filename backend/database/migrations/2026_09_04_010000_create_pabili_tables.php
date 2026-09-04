<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pabili_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            // pending → quoted (staff set prices) → approved/declined (customer)
            // → converted (real Order created) ; customer may cancel while pending
            $table->string('status', 20)->default('pending')->index();
            $table->string('delivery_address')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('notes')->nullable();
            $table->decimal('quoted_total', 10, 2)->nullable();   // items only
            $table->decimal('quoted_shipping', 10, 2)->nullable();
            $table->foreignId('quoted_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('quote_note')->nullable();
            $table->timestamp('quoted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->string('decline_reason', 255)->nullable();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('pabili_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pabili_request_id')->constrained()->cascadeOnDelete();
            $table->string('product_name', 160);
            $table->string('details', 500)->nullable();
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->decimal('max_price', 10, 2)->nullable();      // customer hint
            $table->decimal('quoted_price', 10, 2)->nullable();   // staff-confirmed TOTAL for the line
            $table->string('staff_note', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pabili_items');
        Schema::dropIfExists('pabili_requests');
    }
};

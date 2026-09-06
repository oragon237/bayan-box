<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('conversion_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('event_id')->unique();
            $table->uuid('session_id')->index();
            $table->string('event', 40)->index();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedInteger('quantity')->nullable();
            $table->foreignId('order_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('utm_source', 80)->nullable();
            $table->string('utm_medium', 80)->nullable();
            $table->string('utm_campaign', 80)->nullable();
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void { Schema::dropIfExists('conversion_events'); }
};

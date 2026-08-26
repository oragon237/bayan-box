<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Service categories & global rates for skilled workers — PRD 4.1 #5.
     */
    public function up(): void
    {
        Schema::create('service_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->notNull();
            $table->decimal('base_pakyaw_rate', 10, 2)->notNull();
            $table->decimal('global_commission_percentage', 5, 2)->default(15.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_categories');
    }
};

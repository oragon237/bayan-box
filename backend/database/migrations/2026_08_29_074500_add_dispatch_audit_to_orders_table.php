<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Track dispatch method (auto vs manual) and the staff member who
     * assigned a raider, for delivery-history audit purposes.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('dispatch_method', 20)->nullable()->after('rider_id'); // auto | manual
            $table->foreignId('assigned_by_id')->nullable()->constrained('users')->nullOnDelete()->after('dispatch_method');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['assigned_by_id']);
            $table->dropColumn(['dispatch_method', 'assigned_by_id']);
        });
    }
};
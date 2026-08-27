<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Points-only products: buyable exclusively with Suki Points (no cash).
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->integer('points_price')->nullable()->after('sale_price'); // cost in Suki Points
            $table->boolean('points_only')->default(false)->after('points_price');
            $table->index('points_only');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['points_only']);
            $table->dropColumn(['points_only', 'points_price']);
        });
    }
};
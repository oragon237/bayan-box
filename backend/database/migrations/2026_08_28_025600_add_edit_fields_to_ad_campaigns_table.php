<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ad campaign edit support: title, display order, keywords.
     */
    public function up(): void
    {
        Schema::table('ad_campaigns', function (Blueprint $table) {
            $table->string('title', 150)->nullable()->after('ad_type');
            $table->integer('display_order')->default(0)->after('end_date');
            $table->string('keywords', 255)->nullable()->after('display_order');
        });
    }

    public function down(): void
    {
        Schema::table('ad_campaigns', function (Blueprint $table) {
            $table->dropColumn(['title', 'display_order', 'keywords']);
        });
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Module 3: Admin merchant verification + Bayan Mall flags.
     *
     * users:     is_official_mall (system flagship store), verification_notes,
     *            verified_at.
     * products:  is_official_mall (badge + commission-waived sales).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_official_mall')->default(false)->after('status');
            $table->text('verification_notes')->nullable()->after('is_official_mall');
            $table->timestamp('verified_at')->nullable()->after('verification_notes');
            $table->index('status');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_official_mall')->default(false)->after('status');
            $table->index('is_official_mall');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['is_official_mall']);
            $table->dropColumn('is_official_mall');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn(['verified_at', 'verification_notes', 'is_official_mall']);
        });
    }
};
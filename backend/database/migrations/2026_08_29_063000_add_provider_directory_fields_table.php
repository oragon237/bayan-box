<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Provider directory fields: availability, hourly rate, completed jobs,
     * and profile view tracking.
     */
    public function up(): void
    {
        Schema::table('provider_profiles', function (Blueprint $table) {
            $table->string('availability', 30)->default('available_now')->after('is_official'); // available_now | available_this_week | schedule_ahead | emergency
            $table->decimal('hourly_rate', 10, 2)->nullable()->after('availability');
            $table->integer('completed_jobs')->default(0)->after('hourly_rate');
            $table->integer('profile_views')->default(0)->after('completed_jobs');
        });
    }

    public function down(): void
    {
        Schema::table('provider_profiles', function (Blueprint $table) {
            $table->dropColumn(['availability', 'hourly_rate', 'completed_jobs', 'profile_views']);
        });
    }
};
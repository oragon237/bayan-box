<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Provider profile pictures, official BeCoolBox Worker badge, and
     * provider reviews/ratings (item 7).
     */
    public function up(): void
    {
        Schema::table('provider_profiles', function (Blueprint $table) {
            $table->string('picture_url', 255)->nullable()->after('skills');
            $table->boolean('is_official')->default(false)->after('is_verified');
        });

        Schema::create('provider_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->unsignedTinyInteger('rating'); // 1–5 stars
            $table->text('review')->nullable();
            $table->timestamps();

            $table->unique(['customer_id', 'provider_id']);
            $table->index('provider_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_reviews');

        Schema::table('provider_profiles', function (Blueprint $table) {
            $table->dropColumn(['picture_url', 'is_official']);
        });
    }
};
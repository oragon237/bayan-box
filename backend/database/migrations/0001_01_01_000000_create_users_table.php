<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Unified Users table (PRD 4.1 #2).
     *
     * Implements the `user_role` enum domain from the PRD via a CHECK
     * constraint (admin, staff, rider, merchant, customer, provider) so the
     * migration stays portable across PostgreSQL/SQLite while preserving the
     * exact role surface area. On PostgreSQL this is equivalent to
     * `CREATE TYPE user_role AS ENUM (...)`.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->notNull();
            $table->string('phone', 20)->unique()->notNull();
            $table->string('email')->nullable()->unique();
            $table->string('password_hash', 255)->notNull();
            $table->string('role', 20)->default('customer');
            $table->string('affiliate_code', 15)->unique()->notNull();
            $table->foreignId('referred_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('barangay', 100)->nullable();
            $table->string('municipality', 100)->nullable()->index();
            $table->string('status', 20)->default('active');
            $table->rememberToken();
            $table->timestamps();

            $table->index('role');
        });

        if (DB::connection()->getDriverName() !== 'sqlite') {
            DB::statement(
                "ALTER TABLE users ADD CONSTRAINT users_role_check
                 CHECK (role IN ('admin', 'staff', 'rider', 'merchant', 'customer', 'provider'))"
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};

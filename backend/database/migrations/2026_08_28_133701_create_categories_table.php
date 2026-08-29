<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Admin-managed product categories (name, slug, icon, sort_order, is_active).
     */
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->string('slug', 60)->unique();
            $table->string('icon', 50)->default('📦');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Seed default categories
        $cats = ['Fresh Produce', 'Local Crafts', 'Packaging', 'Home Cooks', 'Points Shop', 'Provincial Goods', 'Office Supplies'];
        foreach ($cats as $i => $name) {
            $icons = ['🥬', '🧶', '📦', '🍳', '🪙', '🏝️', '📎'];
            DB::table('categories')->insert([
                'name' => $name,
                'slug' => strtolower(str_replace(' ', '-', $name)),
                'icon' => $icons[$i],
                'sort_order' => $i,
                'is_active' => true,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
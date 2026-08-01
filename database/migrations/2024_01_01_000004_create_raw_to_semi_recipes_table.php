<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_to_semi_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('raw_material_id')->constrained()->cascadeOnDelete();
            $table->foreignId('semi_finished_product_id')->constrained()->cascadeOnDelete();
            $table->decimal('input_quantity_per_unit', 12, 4);
            $table->timestamps();

            $table->unique(['raw_material_id', 'semi_finished_product_id'], 'raw_semi_recipe_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_to_semi_recipes');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semi_to_finished_recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semi_finished_product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('finished_product_id')->constrained()->cascadeOnDelete();
            $table->decimal('input_quantity_per_unit', 12, 4);
            $table->timestamps();

            $table->unique(['semi_finished_product_id', 'finished_product_id'], 'semi_finished_recipe_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semi_to_finished_recipes');
    }
};

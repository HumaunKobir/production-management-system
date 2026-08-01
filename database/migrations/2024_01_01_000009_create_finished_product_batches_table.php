<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finished_product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('finished_product_id')->constrained()->cascadeOnDelete();
            $table->string('batch_number')->unique();
            $table->decimal('quantity', 12, 4);
            $table->timestamp('produced_at');
            $table->foreignId('production_batch_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finished_product_batches');
    }
};

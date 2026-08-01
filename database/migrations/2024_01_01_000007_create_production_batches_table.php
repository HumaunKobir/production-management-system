<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('production_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number')->unique();
            $table->enum('type', ['raw_to_semi', 'semi_to_finished']);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->string('output_product_type');
            $table->unsignedBigInteger('output_product_id');
            $table->decimal('output_quantity', 12, 4);
            $table->text('notes')->nullable();
            $table->timestamp('production_timestamp');
            $table->timestamp('completed_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            $table->index(['output_product_type', 'output_product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_batches');
    }
};

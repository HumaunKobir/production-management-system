<?php

namespace App\Services;

use App\Enums\ProductionStatus;
use App\Enums\ProductionType;
use App\Jobs\ProcessProductionBatch;
use App\Models\FinishedProduct;
use App\Models\FinishedProductBatch;
use App\Models\ProductionBatch;
use App\Models\ProductionEvent;
use App\Models\ProductionInput;
use App\Models\RawMaterialBatch;
use App\Models\RawToSemiRecipe;
use App\Models\SemiFinishedBatch;
use App\Models\SemiFinishedProduct;
use App\Models\SemiToFinishedRecipe;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProductionService
{
    public function __construct(
        private readonly InventoryService $inventoryService,
        private readonly ProductionNotificationService $notificationService,
    ) {}

    public function initiateRawToSemiProduction(
        int $semiFinishedProductId,
        float $outputQuantity,
        ?string $batchNumber = null,
        ?string $notes = null,
    ): ProductionBatch {
        $product = SemiFinishedProduct::findOrFail($semiFinishedProductId);
        $recipes = RawToSemiRecipe::where('semi_finished_product_id', $product->id)->get();

        if ($recipes->isEmpty()) {
            throw new \InvalidArgumentException('No recipe defined for this semi-finished product.');
        }

        foreach ($recipes as $recipe) {
            $required = (float) $recipe->input_quantity_per_unit * $outputQuantity;
            $available = $this->inventoryService->getAvailableQuantityForRawMaterial($recipe->raw_material_id);

            if ($available < $required) {
                throw new \RuntimeException(
                    "Insufficient raw material (ID: {$recipe->raw_material_id}). Required: {$required}, Available: {$available}"
                );
            }
        }

        $batch = ProductionBatch::create([
            'batch_number' => $batchNumber ?? 'PB-'.Str::upper(Str::random(8)),
            'type' => ProductionType::RawToSemi,
            'status' => ProductionStatus::Pending,
            'output_product_type' => SemiFinishedProduct::class,
            'output_product_id' => $product->id,
            'output_quantity' => $outputQuantity,
            'notes' => $notes,
            'production_timestamp' => now(),
        ]);

        $this->logEvent($batch, 'production_initiated', 'Production batch created and queued for processing.');

        ProcessProductionBatch::dispatch($batch->id)->onQueue('production');

        return $batch;
    }

    public function initiateSemiToFinishedProduction(
        int $finishedProductId,
        float $outputQuantity,
        ?string $batchNumber = null,
        ?string $notes = null,
    ): ProductionBatch {
        $product = FinishedProduct::findOrFail($finishedProductId);
        $recipes = SemiToFinishedRecipe::where('finished_product_id', $product->id)->get();

        if ($recipes->isEmpty()) {
            throw new \InvalidArgumentException('No recipe defined for this finished product.');
        }

        foreach ($recipes as $recipe) {
            $required = (float) $recipe->input_quantity_per_unit * $outputQuantity;
            $available = $this->inventoryService->getAvailableQuantityForSemiFinished($recipe->semi_finished_product_id);

            if ($available < $required) {
                throw new \RuntimeException(
                    "Insufficient semi-finished product (ID: {$recipe->semi_finished_product_id}). Required: {$required}, Available: {$available}"
                );
            }
        }

        $batch = ProductionBatch::create([
            'batch_number' => $batchNumber ?? 'PB-'.Str::upper(Str::random(8)),
            'type' => ProductionType::SemiToFinished,
            'status' => ProductionStatus::Pending,
            'output_product_type' => FinishedProduct::class,
            'output_product_id' => $product->id,
            'output_quantity' => $outputQuantity,
            'notes' => $notes,
            'production_timestamp' => now(),
        ]);

        $this->logEvent($batch, 'production_initiated', 'Production batch created and queued for processing.');

        ProcessProductionBatch::dispatch($batch->id)->onQueue('production');

        return $batch;
    }

    public function processProductionBatch(int $productionBatchId): void
    {
        DB::transaction(function () use ($productionBatchId) {
            $batch = ProductionBatch::lockForUpdate()->findOrFail($productionBatchId);

            if ($batch->status !== ProductionStatus::Pending) {
                return;
            }

            $batch->update(['status' => ProductionStatus::Processing]);
            $this->logEvent($batch, 'processing_started', 'Worker started processing production batch.');

            try {
                match ($batch->type) {
                    ProductionType::RawToSemi => $this->executeRawToSemi($batch),
                    ProductionType::SemiToFinished => $this->executeSemiToFinished($batch),
                };

                $batch->update([
                    'status' => ProductionStatus::Completed,
                    'completed_at' => now(),
                ]);

                $this->logEvent($batch, 'production_completed', 'Production completed successfully.');
                $this->notificationService->notifyProductionCompleted($batch->fresh());
                Log::info("Production batch {$batch->batch_number} completed.");
            } catch (\Throwable $e) {
                $batch->update([
                    'status' => ProductionStatus::Failed,
                    'failure_reason' => $e->getMessage(),
                ]);

                $this->logEvent($batch, 'production_failed', $e->getMessage());
                $this->notificationService->notifyProductionFailed($batch->fresh(), $e->getMessage());
                Log::error("Production batch {$batch->batch_number} failed: {$e->getMessage()}");

                throw $e;
            }
        });
    }

    private function executeRawToSemi(ProductionBatch $batch): void
    {
        $recipes = RawToSemiRecipe::where('semi_finished_product_id', $batch->output_product_id)->get();

        foreach ($recipes as $recipe) {
            $required = (float) $recipe->input_quantity_per_unit * (float) $batch->output_quantity;
            $allocations = $this->inventoryService->allocateRawMaterialBatches($recipe->raw_material_id, $required);

            foreach ($allocations as $allocation) {
                /** @var RawMaterialBatch $sourceBatch */
                $sourceBatch = $allocation['batch'];
                $sourceBatch->decrement('remaining_quantity', $allocation['quantity']);

                ProductionInput::create([
                    'production_batch_id' => $batch->id,
                    'source_type' => RawMaterialBatch::class,
                    'source_id' => $sourceBatch->id,
                    'quantity_consumed' => $allocation['quantity'],
                ]);
            }
        }

        SemiFinishedBatch::create([
            'semi_finished_product_id' => $batch->output_product_id,
            'batch_number' => 'SF-'.$batch->batch_number,
            'quantity' => $batch->output_quantity,
            'remaining_quantity' => $batch->output_quantity,
            'produced_at' => now(),
            'production_batch_id' => $batch->id,
        ]);

        $this->logEvent($batch, 'inventory_updated', 'Raw material deducted and semi-finished batch created.');
    }

    private function executeSemiToFinished(ProductionBatch $batch): void
    {
        $recipes = SemiToFinishedRecipe::where('finished_product_id', $batch->output_product_id)->get();

        foreach ($recipes as $recipe) {
            $required = (float) $recipe->input_quantity_per_unit * (float) $batch->output_quantity;
            $allocations = $this->inventoryService->allocateSemiFinishedBatches($recipe->semi_finished_product_id, $required);

            foreach ($allocations as $allocation) {
                /** @var SemiFinishedBatch $sourceBatch */
                $sourceBatch = $allocation['batch'];
                $sourceBatch->decrement('remaining_quantity', $allocation['quantity']);

                ProductionInput::create([
                    'production_batch_id' => $batch->id,
                    'source_type' => SemiFinishedBatch::class,
                    'source_id' => $sourceBatch->id,
                    'quantity_consumed' => $allocation['quantity'],
                ]);
            }
        }

        FinishedProductBatch::create([
            'finished_product_id' => $batch->output_product_id,
            'batch_number' => 'FP-'.$batch->batch_number,
            'quantity' => $batch->output_quantity,
            'produced_at' => now(),
            'production_batch_id' => $batch->id,
        ]);

        $this->logEvent($batch, 'inventory_updated', 'Semi-finished deducted and finished product batch created.');
    }

    private function logEvent(ProductionBatch $batch, string $type, string $message, ?array $metadata = null): void
    {
        ProductionEvent::create([
            'production_batch_id' => $batch->id,
            'event_type' => $type,
            'message' => $message,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }

    public function updateBatch(ProductionBatch $batch, array $data): ProductionBatch
    {
        if (isset($data['batch_number']) && $batch->status !== ProductionStatus::Pending) {
            throw new \InvalidArgumentException('Batch number can only be changed while pending.');
        }

        $batch->update($data);
        $this->logEvent($batch, 'batch_updated', 'Production batch details updated.');

        return $batch->fresh();
    }

    public function changeStatus(ProductionBatch $batch, ProductionStatus $newStatus): ProductionBatch
    {
        $allowed = match ($batch->status) {
            ProductionStatus::Pending => [ProductionStatus::Failed, ProductionStatus::Processing],
            ProductionStatus::Processing => [ProductionStatus::Failed],
            ProductionStatus::Failed => [ProductionStatus::Pending],
            ProductionStatus::Completed => [],
        };

        if (! in_array($newStatus, $allowed, true)) {
            throw new \InvalidArgumentException(
                "Cannot change status from {$batch->status->value} to {$newStatus->value}."
            );
        }

        if ($newStatus === ProductionStatus::Failed) {
            $batch->update([
                'status' => ProductionStatus::Failed,
                'failure_reason' => 'Cancelled or marked failed by user.',
            ]);
            $this->logEvent($batch, 'status_changed', 'Batch marked as failed.');

            return $batch->fresh();
        }

        if ($newStatus === ProductionStatus::Pending && $batch->status === ProductionStatus::Failed) {
            $batch->update([
                'status' => ProductionStatus::Pending,
                'failure_reason' => null,
                'completed_at' => null,
            ]);
            $this->logEvent($batch, 'status_changed', 'Batch reset to pending for retry.');
            ProcessProductionBatch::dispatch($batch->id)->onQueue('production');

            return $batch->fresh();
        }

        if ($newStatus === ProductionStatus::Processing && $batch->status === ProductionStatus::Pending) {
            $this->logEvent($batch, 'status_changed', 'Batch queued for processing.');
            ProcessProductionBatch::dispatch($batch->id)->onQueue('production');
        }

        return $batch->fresh();
    }

    public function deleteBatch(ProductionBatch $batch): void
    {
        if (! in_array($batch->status, [ProductionStatus::Pending, ProductionStatus::Failed], true)) {
            throw new \InvalidArgumentException('Only pending or failed batches can be deleted.');
        }

        $batch->delete();
    }
}

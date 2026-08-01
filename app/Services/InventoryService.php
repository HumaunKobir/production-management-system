<?php

namespace App\Services;

use App\Models\FinishedProduct;
use App\Models\RawMaterial;
use App\Models\RawMaterialBatch;
use App\Models\SemiFinishedProduct;
use Illuminate\Support\Str;

class InventoryService
{
    public function getAllInventory(): array
    {
        return [
            'raw_materials' => RawMaterial::with('batches')->get()->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'unit' => $item->unit,
                'quantity' => $item->inventory_quantity,
                'batches' => $item->batches->map(fn ($batch) => [
                    'id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'remaining_quantity' => $batch->remaining_quantity,
                    'received_at' => $batch->received_at,
                ]),
            ]),
            'semi_finished_products' => SemiFinishedProduct::with('batches')->get()->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'unit' => $item->unit,
                'quantity' => $item->inventory_quantity,
                'batches' => $item->batches->map(fn ($batch) => [
                    'id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'remaining_quantity' => $batch->remaining_quantity,
                    'produced_at' => $batch->produced_at,
                ]),
            ]),
            'finished_products' => FinishedProduct::with('batches')->get()->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'sku' => $item->sku,
                'unit' => $item->unit,
                'quantity' => $item->inventory_quantity,
                'batches' => $item->batches->map(fn ($batch) => [
                    'id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'quantity' => $batch->quantity,
                    'produced_at' => $batch->produced_at,
                ]),
            ]),
        ];
    }

    public function receiveRawMaterial(
        int $rawMaterialId,
        float $quantity,
        ?string $batchNumber = null,
    ): RawMaterialBatch {
        $rawMaterial = RawMaterial::findOrFail($rawMaterialId);

        return RawMaterialBatch::create([
            'raw_material_id' => $rawMaterial->id,
            'batch_number' => $batchNumber ?? 'RM-'.Str::upper(Str::random(8)),
            'quantity' => $quantity,
            'remaining_quantity' => $quantity,
            'received_at' => now(),
        ]);
    }

    public function getAvailableQuantityForRawMaterial(int $rawMaterialId): float
    {
        return (float) RawMaterialBatch::where('raw_material_id', $rawMaterialId)
            ->sum('remaining_quantity');
    }

    public function getAvailableQuantityForSemiFinished(int $semiFinishedProductId): float
    {
        return (float) \App\Models\SemiFinishedBatch::where('semi_finished_product_id', $semiFinishedProductId)
            ->sum('remaining_quantity');
    }

    /**
     * @return array<int, array{batch: RawMaterialBatch, quantity: float}>
     */
    public function allocateRawMaterialBatches(int $rawMaterialId, float $requiredQuantity): array
    {
        $allocations = [];
        $remaining = $requiredQuantity;

        $batches = RawMaterialBatch::where('raw_material_id', $rawMaterialId)
            ->where('remaining_quantity', '>', 0)
            ->orderBy('received_at')
            ->lockForUpdate()
            ->get();

        foreach ($batches as $batch) {
            if ($remaining <= 0) {
                break;
            }

            $take = min((float) $batch->remaining_quantity, $remaining);
            $allocations[] = ['batch' => $batch, 'quantity' => $take];
            $remaining -= $take;
        }

        if ($remaining > 0) {
            throw new \RuntimeException("Insufficient raw material inventory. Short by {$remaining} units.");
        }

        return $allocations;
    }

    /**
     * @return array<int, array{batch: \App\Models\SemiFinishedBatch, quantity: float}>
     */
    public function allocateSemiFinishedBatches(int $semiFinishedProductId, float $requiredQuantity): array
    {
        $allocations = [];
        $remaining = $requiredQuantity;

        $batches = \App\Models\SemiFinishedBatch::where('semi_finished_product_id', $semiFinishedProductId)
            ->where('remaining_quantity', '>', 0)
            ->orderBy('produced_at')
            ->lockForUpdate()
            ->get();

        foreach ($batches as $batch) {
            if ($remaining <= 0) {
                break;
            }

            $take = min((float) $batch->remaining_quantity, $remaining);
            $allocations[] = ['batch' => $batch, 'quantity' => $take];
            $remaining -= $take;
        }

        if ($remaining > 0) {
            throw new \RuntimeException("Insufficient semi-finished inventory. Short by {$remaining} units.");
        }

        return $allocations;
    }
}

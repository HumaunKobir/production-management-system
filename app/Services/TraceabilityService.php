<?php

namespace App\Services;

use App\Models\FinishedProductBatch;
use App\Models\ProductionBatch;
use App\Models\RawMaterialBatch;
use App\Models\SemiFinishedBatch;

class TraceabilityService
{
    public function traceFinishedProductBatch(int $finishedProductBatchId): array
    {
        $finishedBatch = FinishedProductBatch::with([
            'finishedProduct',
            'productionBatch.inputs',
        ])->findOrFail($finishedProductBatchId);

        $productionBatch = $finishedBatch->productionBatch;

        return [
            'finished_product_batch' => [
                'id' => $finishedBatch->id,
                'batch_number' => $finishedBatch->batch_number,
                'quantity' => $finishedBatch->quantity,
                'produced_at' => $finishedBatch->produced_at,
                'product' => [
                    'id' => $finishedBatch->finishedProduct->id,
                    'name' => $finishedBatch->finishedProduct->name,
                    'sku' => $finishedBatch->finishedProduct->sku,
                ],
            ],
            'production_batch' => $this->formatProductionBatch($productionBatch),
            'semi_finished_sources' => $this->traceSemiFinishedInputs($productionBatch),
        ];
    }

    public function traceProductionBatch(int $productionBatchId): array
    {
        $batch = ProductionBatch::with(['inputs', 'events', 'semiFinishedBatch', 'finishedProductBatch'])
            ->findOrFail($productionBatchId);

        $result = [
            'production_batch' => $this->formatProductionBatch($batch),
            'events' => $batch->events->map(fn ($event) => [
                'event_type' => $event->event_type,
                'message' => $event->message,
                'metadata' => $event->metadata,
                'created_at' => $event->created_at,
            ]),
        ];

        if ($batch->type->value === 'raw_to_semi') {
            $result['raw_material_sources'] = $this->traceRawMaterialInputs($batch);
            $result['output'] = $batch->semiFinishedBatch ? [
                'type' => 'semi_finished',
                'batch_number' => $batch->semiFinishedBatch->batch_number,
                'quantity' => $batch->semiFinishedBatch->quantity,
            ] : null;
        } else {
            $result['semi_finished_sources'] = $this->traceSemiFinishedInputs($batch);
            $result['output'] = $batch->finishedProductBatch ? [
                'type' => 'finished',
                'batch_number' => $batch->finishedProductBatch->batch_number,
                'quantity' => $batch->finishedProductBatch->quantity,
            ] : null;
        }

        return $result;
    }

    public function getProductionHistory(): array
    {
        return ProductionBatch::with(['events'])
            ->orderByDesc('production_timestamp')
            ->get()
            ->map(fn ($batch) => $this->formatProductionBatch($batch))
            ->toArray();
    }

    private function traceSemiFinishedInputs(ProductionBatch $batch): array
    {
        return $batch->inputs
            ->where('source_type', SemiFinishedBatch::class)
            ->map(function ($input) {
                $semiBatch = SemiFinishedBatch::with([
                    'semiFinishedProduct',
                    'productionBatch.inputs',
                ])->find($input->source_id);

                if (! $semiBatch) {
                    return null;
                }

                return [
                    'semi_finished_batch' => [
                        'id' => $semiBatch->id,
                        'batch_number' => $semiBatch->batch_number,
                        'quantity_consumed' => $input->quantity_consumed,
                        'product' => [
                            'id' => $semiBatch->semiFinishedProduct->id,
                            'name' => $semiBatch->semiFinishedProduct->name,
                            'sku' => $semiBatch->semiFinishedProduct->sku,
                        ],
                    ],
                    'production_batch' => $this->formatProductionBatch($semiBatch->productionBatch),
                    'raw_material_sources' => $this->traceRawMaterialInputs($semiBatch->productionBatch),
                ];
            })
            ->filter()
            ->values()
            ->toArray();
    }

    private function traceRawMaterialInputs(ProductionBatch $batch): array
    {
        return $batch->inputs
            ->where('source_type', RawMaterialBatch::class)
            ->map(function ($input) {
                $rawBatch = RawMaterialBatch::with('rawMaterial')->find($input->source_id);

                if (! $rawBatch) {
                    return null;
                }

                return [
                    'raw_material_batch' => [
                        'id' => $rawBatch->id,
                        'batch_number' => $rawBatch->batch_number,
                        'quantity_consumed' => $input->quantity_consumed,
                        'received_at' => $rawBatch->received_at,
                    ],
                    'raw_material' => [
                        'id' => $rawBatch->rawMaterial->id,
                        'name' => $rawBatch->rawMaterial->name,
                        'sku' => $rawBatch->rawMaterial->sku,
                    ],
                ];
            })
            ->filter()
            ->values()
            ->toArray();
    }

    private function formatProductionBatch(ProductionBatch $batch): array
    {
        return [
            'id' => $batch->id,
            'batch_number' => $batch->batch_number,
            'type' => $batch->type->value,
            'status' => $batch->status->value,
            'output_product_type' => class_basename($batch->output_product_type),
            'output_product_id' => $batch->output_product_id,
            'output_quantity' => $batch->output_quantity,
            'production_timestamp' => $batch->production_timestamp,
            'completed_at' => $batch->completed_at,
            'notes' => $batch->notes,
            'failure_reason' => $batch->failure_reason,
        ];
    }
}

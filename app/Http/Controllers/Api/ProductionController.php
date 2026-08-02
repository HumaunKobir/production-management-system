<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductionBatch;
use App\Services\ProductionService;
use App\Services\TraceabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductionController extends Controller
{
    public function __construct(
        private readonly ProductionService $productionService,
        private readonly TraceabilityService $traceabilityService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => $this->traceabilityService->getProductionHistory(),
        ]);
    }

    public function show(ProductionBatch $productionBatch): JsonResponse
    {
        return response()->json([
            'data' => $this->traceabilityService->traceProductionBatch($productionBatch->id),
        ]);
    }

    public function rawToSemi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'semi_finished_product_id' => 'required|exists:semi_finished_products,id',
            'output_quantity' => 'required|numeric|min:0.0001',
            'batch_number' => 'nullable|string|max:100|unique:production_batches,batch_number',
            'notes' => 'nullable|string',
        ]);

        try {
            $batch = $this->productionService->initiateRawToSemiProduction(
                $validated['semi_finished_product_id'],
                $validated['output_quantity'],
                $validated['batch_number'] ?? null,
                $validated['notes'] ?? null,
            );

            return response()->json([
                'message' => 'Production batch queued for processing.',
                'data' => $batch,
            ], 202);
        } catch (\RuntimeException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function semiToFinished(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'finished_product_id' => 'required|exists:finished_products,id',
            'output_quantity' => 'required|numeric|min:0.0001',
            'batch_number' => 'nullable|string|max:100|unique:production_batches,batch_number',
            'notes' => 'nullable|string',
        ]);

        try {
            $batch = $this->productionService->initiateSemiToFinishedProduction(
                $validated['finished_product_id'],
                $validated['output_quantity'],
                $validated['batch_number'] ?? null,
                $validated['notes'] ?? null,
            );

            return response()->json([
                'message' => 'Production batch queued for processing.',
                'data' => $batch,
            ], 202);
        } catch (\RuntimeException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}

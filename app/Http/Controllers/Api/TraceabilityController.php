<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinishedProductBatch;
use App\Services\TraceabilityService;
use Illuminate\Http\JsonResponse;

class TraceabilityController extends Controller
{
    public function __construct(
        private readonly TraceabilityService $traceabilityService,
    ) {}

    public function index(): JsonResponse
    {
        $batches = FinishedProductBatch::with('finishedProduct')
            ->orderByDesc('produced_at')
            ->get()
            ->map(fn ($batch) => [
                'id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'quantity' => $batch->quantity,
                'produced_at' => $batch->produced_at,
                'product_name' => $batch->finishedProduct?->name,
                'product_sku' => $batch->finishedProduct?->sku,
            ]);

        return response()->json(['data' => $batches]);
    }

    public function traceFinishedBatch(int $finishedProductBatch): JsonResponse
    {
        $batch = FinishedProductBatch::find($finishedProductBatch);

        if (! $batch) {
            return response()->json([
                'message' => 'Finished product batch not found. Batches are created when semi-to-finished production completes. Check Inventory or run production first.',
            ], 404);
        }

        return response()->json([
            'data' => $this->traceabilityService->traceFinishedProductBatch($batch->id),
        ]);
    }
}

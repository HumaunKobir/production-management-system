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

    public function traceFinishedBatch(FinishedProductBatch $finishedProductBatch): JsonResponse
    {
        return response()->json([
            'data' => $this->traceabilityService->traceFinishedProductBatch($finishedProductBatch->id),
        ]);
    }
}

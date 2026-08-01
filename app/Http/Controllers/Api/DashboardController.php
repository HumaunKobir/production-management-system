<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinishedProduct;
use App\Models\FinishedProductBatch;
use App\Models\ProductionBatch;
use App\Models\RawMaterial;
use App\Models\SemiFinishedProduct;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $recentProduction = ProductionBatch::orderByDesc('production_timestamp')
            ->limit(5)
            ->get()
            ->map(fn ($batch) => [
                'id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'type' => $batch->type->value,
                'status' => $batch->status->value,
                'output_quantity' => $batch->output_quantity,
                'production_timestamp' => $batch->production_timestamp,
            ]);

        return response()->json([
            'data' => [
                'stats' => [
                    'raw_materials' => RawMaterial::count(),
                    'semi_finished_products' => SemiFinishedProduct::count(),
                    'finished_products' => FinishedProduct::count(),
                    'production_batches' => ProductionBatch::count(),
                    'completed_batches' => ProductionBatch::where('status', 'completed')->count(),
                    'finished_batches' => FinishedProductBatch::count(),
                ],
                'recent_production' => $recentProduction,
            ],
        ]);
    }
}

<?php

namespace App\Jobs;

use App\Services\ProductionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessProductionBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public readonly int $productionBatchId,
    ) {}

    public function handle(ProductionService $productionService): void
    {
        Log::info("Processing production batch ID: {$this->productionBatchId}");

        $productionService->processProductionBatch($this->productionBatchId);
    }
}

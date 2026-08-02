<?php

namespace App\Services;

use App\Models\ProductionBatch;
use Illuminate\Support\Facades\Log;

class ProductionNotificationService
{
    public function notifyProductionCompleted(ProductionBatch $batch): void
    {
        $message = sprintf(
            'Production batch %s (%s) completed. Output quantity: %s',
            $batch->batch_number,
            $batch->type->value,
            $batch->output_quantity,
        );

        Log::channel('stack')->info('[Production Notification] '.$message, [
            'batch_id' => $batch->id,
            'batch_number' => $batch->batch_number,
            'type' => $batch->type->value,
            'status' => $batch->status->value,
            'output_quantity' => $batch->output_quantity,
        ]);
    }

    public function notifyProductionFailed(ProductionBatch $batch, string $reason): void
    {
        $message = sprintf(
            'Production batch %s failed: %s',
            $batch->batch_number,
            $reason,
        );

        Log::channel('stack')->error('[Production Notification] '.$message, [
            'batch_id' => $batch->id,
            'batch_number' => $batch->batch_number,
            'failure_reason' => $reason,
        ]);
    }
}

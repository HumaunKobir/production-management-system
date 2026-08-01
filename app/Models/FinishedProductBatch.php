<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinishedProductBatch extends Model
{
    protected $fillable = [
        'finished_product_id',
        'batch_number',
        'quantity',
        'produced_at',
        'production_batch_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'produced_at' => 'datetime',
        ];
    }

    public function finishedProduct(): BelongsTo
    {
        return $this->belongsTo(FinishedProduct::class);
    }

    public function productionBatch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ProductionInput extends Model
{
    protected $fillable = [
        'production_batch_id',
        'source_type',
        'source_id',
        'quantity_consumed',
    ];

    protected function casts(): array
    {
        return [
            'quantity_consumed' => 'decimal:4',
        ];
    }

    public function productionBatch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class);
    }

    public function source(): MorphTo
    {
        return $this->morphTo();
    }
}

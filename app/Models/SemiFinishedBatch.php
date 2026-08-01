<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SemiFinishedBatch extends Model
{
    protected $fillable = [
        'semi_finished_product_id',
        'batch_number',
        'quantity',
        'remaining_quantity',
        'produced_at',
        'production_batch_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'remaining_quantity' => 'decimal:4',
            'produced_at' => 'datetime',
        ];
    }

    public function semiFinishedProduct(): BelongsTo
    {
        return $this->belongsTo(SemiFinishedProduct::class);
    }

    public function productionBatch(): BelongsTo
    {
        return $this->belongsTo(ProductionBatch::class);
    }

    public function productionInputs(): HasMany
    {
        return $this->hasMany(ProductionInput::class, 'source_id')
            ->where('source_type', self::class);
    }
}

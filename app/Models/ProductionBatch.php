<?php

namespace App\Models;

use App\Enums\ProductionStatus;
use App\Enums\ProductionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProductionBatch extends Model
{
    protected $fillable = [
        'batch_number',
        'type',
        'status',
        'output_product_type',
        'output_product_id',
        'output_quantity',
        'notes',
        'production_timestamp',
        'completed_at',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'type' => ProductionType::class,
            'status' => ProductionStatus::class,
            'output_quantity' => 'decimal:4',
            'production_timestamp' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function inputs(): HasMany
    {
        return $this->hasMany(ProductionInput::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ProductionEvent::class);
    }

    public function semiFinishedBatch(): HasOne
    {
        return $this->hasOne(SemiFinishedBatch::class);
    }

    public function finishedProductBatch(): HasOne
    {
        return $this->hasOne(FinishedProductBatch::class);
    }

    public function outputProduct()
    {
        return match ($this->output_product_type) {
            SemiFinishedProduct::class => $this->belongsTo(SemiFinishedProduct::class, 'output_product_id'),
            FinishedProduct::class => $this->belongsTo(FinishedProduct::class, 'output_product_id'),
            default => null,
        };
    }
}

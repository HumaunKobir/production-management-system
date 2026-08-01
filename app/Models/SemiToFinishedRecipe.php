<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SemiToFinishedRecipe extends Model
{
    protected $fillable = [
        'semi_finished_product_id',
        'finished_product_id',
        'input_quantity_per_unit',
    ];

    protected function casts(): array
    {
        return [
            'input_quantity_per_unit' => 'decimal:4',
        ];
    }

    public function semiFinishedProduct(): BelongsTo
    {
        return $this->belongsTo(SemiFinishedProduct::class);
    }

    public function finishedProduct(): BelongsTo
    {
        return $this->belongsTo(FinishedProduct::class);
    }
}

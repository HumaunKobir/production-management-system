<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RawToSemiRecipe extends Model
{
    protected $fillable = [
        'raw_material_id',
        'semi_finished_product_id',
        'input_quantity_per_unit',
    ];

    protected function casts(): array
    {
        return [
            'input_quantity_per_unit' => 'decimal:4',
        ];
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }

    public function semiFinishedProduct(): BelongsTo
    {
        return $this->belongsTo(SemiFinishedProduct::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RawMaterialBatch extends Model
{
    protected $fillable = [
        'raw_material_id',
        'batch_number',
        'quantity',
        'remaining_quantity',
        'received_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'remaining_quantity' => 'decimal:4',
            'received_at' => 'datetime',
        ];
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }

    public function productionInputs(): HasMany
    {
        return $this->hasMany(ProductionInput::class, 'source_id')
            ->where('source_type', self::class);
    }
}

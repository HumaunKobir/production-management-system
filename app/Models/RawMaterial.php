<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RawMaterial extends Model
{
    protected $fillable = ['name', 'sku', 'description', 'unit'];

    public function batches(): HasMany
    {
        return $this->hasMany(RawMaterialBatch::class);
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(RawToSemiRecipe::class);
    }

    public function getInventoryQuantityAttribute(): float
    {
        return (float) $this->batches()->sum('remaining_quantity');
    }
}

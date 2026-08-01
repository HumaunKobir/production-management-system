<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SemiFinishedProduct extends Model
{
    protected $fillable = ['name', 'sku', 'description', 'unit'];

    public function batches(): HasMany
    {
        return $this->hasMany(SemiFinishedBatch::class);
    }

    public function rawRecipes(): HasMany
    {
        return $this->hasMany(RawToSemiRecipe::class);
    }

    public function finishedRecipes(): HasMany
    {
        return $this->hasMany(SemiToFinishedRecipe::class);
    }

    public function getInventoryQuantityAttribute(): float
    {
        return (float) $this->batches()->sum('remaining_quantity');
    }
}

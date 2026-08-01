<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FinishedProduct extends Model
{
    protected $fillable = ['name', 'sku', 'description', 'unit'];

    public function batches(): HasMany
    {
        return $this->hasMany(FinishedProductBatch::class);
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(SemiToFinishedRecipe::class);
    }

    public function getInventoryQuantityAttribute(): float
    {
        return (float) $this->batches()->sum('quantity');
    }
}

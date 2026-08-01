<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SemiFinishedProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SemiFinishedProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = SemiFinishedProduct::all()->map(fn ($p) => [
            ...$p->toArray(),
            'inventory_quantity' => $p->inventory_quantity,
        ]);

        return response()->json(['data' => $products]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:semi_finished_products,sku',
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:20',
        ]);

        $product = SemiFinishedProduct::create($validated);

        return response()->json(['data' => $product], 201);
    }

    public function show(SemiFinishedProduct $semiFinishedProduct): JsonResponse
    {
        return response()->json([
            'data' => [
                ...$semiFinishedProduct->toArray(),
                'inventory_quantity' => $semiFinishedProduct->inventory_quantity,
                'batches' => $semiFinishedProduct->batches,
            ],
        ]);
    }

    public function update(Request $request, SemiFinishedProduct $semiFinishedProduct): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|max:100|unique:semi_finished_products,sku,'.$semiFinishedProduct->id,
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:20',
        ]);

        $semiFinishedProduct->update($validated);

        return response()->json(['data' => $semiFinishedProduct->fresh()]);
    }

    public function destroy(SemiFinishedProduct $semiFinishedProduct): JsonResponse
    {
        $semiFinishedProduct->delete();

        return response()->json(null, 204);
    }
}

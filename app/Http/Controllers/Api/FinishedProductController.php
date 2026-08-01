<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FinishedProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinishedProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = FinishedProduct::all()->map(fn ($p) => [
            ...$p->toArray(),
            'inventory_quantity' => $p->inventory_quantity,
        ]);

        return response()->json(['data' => $products]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:finished_products,sku',
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:20',
        ]);

        $product = FinishedProduct::create($validated);

        return response()->json(['data' => $product], 201);
    }

    public function show(FinishedProduct $finishedProduct): JsonResponse
    {
        return response()->json([
            'data' => [
                ...$finishedProduct->toArray(),
                'inventory_quantity' => $finishedProduct->inventory_quantity,
                'batches' => $finishedProduct->batches,
            ],
        ]);
    }

    public function update(Request $request, FinishedProduct $finishedProduct): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|max:100|unique:finished_products,sku,'.$finishedProduct->id,
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:20',
        ]);

        $finishedProduct->update($validated);

        return response()->json(['data' => $finishedProduct->fresh()]);
    }

    public function destroy(FinishedProduct $finishedProduct): JsonResponse
    {
        $finishedProduct->delete();

        return response()->json(null, 204);
    }
}

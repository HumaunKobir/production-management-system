<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RawMaterial;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RawMaterialController extends Controller
{
    public function index(): JsonResponse
    {
        $materials = RawMaterial::all()->map(fn ($m) => [
            ...$m->toArray(),
            'inventory_quantity' => $m->inventory_quantity,
        ]);

        return response()->json(['data' => $materials]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:raw_materials,sku',
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:20',
        ]);

        $material = RawMaterial::create($validated);

        return response()->json(['data' => $material], 201);
    }

    public function show(RawMaterial $rawMaterial): JsonResponse
    {
        return response()->json([
            'data' => [
                ...$rawMaterial->toArray(),
                'inventory_quantity' => $rawMaterial->inventory_quantity,
                'batches' => $rawMaterial->batches,
            ],
        ]);
    }

    public function update(Request $request, RawMaterial $rawMaterial): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'sometimes|string|max:100|unique:raw_materials,sku,'.$rawMaterial->id,
            'description' => 'nullable|string',
            'unit' => 'nullable|string|max:20',
        ]);

        $rawMaterial->update($validated);

        return response()->json(['data' => $rawMaterial->fresh()]);
    }

    public function destroy(RawMaterial $rawMaterial): JsonResponse
    {
        $rawMaterial->delete();

        return response()->json(null, 204);
    }
}

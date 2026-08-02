<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RawToSemiRecipe;
use App\Models\SemiToFinishedRecipe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function indexRawToSemi(): JsonResponse
    {
        $recipes = RawToSemiRecipe::with(['rawMaterial', 'semiFinishedProduct'])->get();

        return response()->json(['data' => $recipes]);
    }

    public function storeRawToSemi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'raw_material_id' => 'required|exists:raw_materials,id',
            'semi_finished_product_id' => 'required|exists:semi_finished_products,id',
            'input_quantity_per_unit' => 'required|numeric|min:0.0001',
        ]);

        $recipe = RawToSemiRecipe::create($validated);

        return response()->json(['data' => $recipe->load(['rawMaterial', 'semiFinishedProduct'])], 201);
    }

    public function updateRawToSemi(Request $request, RawToSemiRecipe $rawToSemiRecipe): JsonResponse
    {
        $validated = $request->validate([
            'raw_material_id' => 'sometimes|exists:raw_materials,id',
            'semi_finished_product_id' => 'sometimes|exists:semi_finished_products,id',
            'input_quantity_per_unit' => 'sometimes|numeric|min:0.0001',
        ]);

        $rawToSemiRecipe->update($validated);

        return response()->json(['data' => $rawToSemiRecipe->fresh(['rawMaterial', 'semiFinishedProduct'])]);
    }

    public function destroyRawToSemi(RawToSemiRecipe $rawToSemiRecipe): JsonResponse
    {
        $rawToSemiRecipe->delete();

        return response()->json(null, 204);
    }

    public function indexSemiToFinished(): JsonResponse
    {
        $recipes = SemiToFinishedRecipe::with(['semiFinishedProduct', 'finishedProduct'])->get();

        return response()->json(['data' => $recipes]);
    }

    public function storeSemiToFinished(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'semi_finished_product_id' => 'required|exists:semi_finished_products,id',
            'finished_product_id' => 'required|exists:finished_products,id',
            'input_quantity_per_unit' => 'required|numeric|min:0.0001',
        ]);

        $recipe = SemiToFinishedRecipe::create($validated);

        return response()->json(['data' => $recipe->load(['semiFinishedProduct', 'finishedProduct'])], 201);
    }

    public function updateSemiToFinished(Request $request, SemiToFinishedRecipe $semiToFinishedRecipe): JsonResponse
    {
        $validated = $request->validate([
            'semi_finished_product_id' => 'sometimes|exists:semi_finished_products,id',
            'finished_product_id' => 'sometimes|exists:finished_products,id',
            'input_quantity_per_unit' => 'sometimes|numeric|min:0.0001',
        ]);

        $semiToFinishedRecipe->update($validated);

        return response()->json(['data' => $semiToFinishedRecipe->fresh(['semiFinishedProduct', 'finishedProduct'])]);
    }

    public function destroySemiToFinished(SemiToFinishedRecipe $semiToFinishedRecipe): JsonResponse
    {
        $semiToFinishedRecipe->delete();

        return response()->json(null, 204);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RawMaterialBatch;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventoryService,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->inventoryService->getAllInventory()]);
    }

    public function receiveRawMaterial(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'raw_material_id' => 'required|exists:raw_materials,id',
            'quantity' => 'required|numeric|min:0.0001',
            'batch_number' => 'nullable|string|max:100|unique:raw_material_batches,batch_number',
        ]);

        $batch = $this->inventoryService->receiveRawMaterial(
            $validated['raw_material_id'],
            $validated['quantity'],
            $validated['batch_number'] ?? null,
        );

        return response()->json(['data' => $batch->load('rawMaterial')], 201);
    }

    public function updateRawMaterialBatch(Request $request, RawMaterialBatch $rawMaterialBatch): JsonResponse
    {
        $validated = $request->validate([
            'batch_number' => 'sometimes|string|max:100|unique:raw_material_batches,batch_number,'.$rawMaterialBatch->id,
            'remaining_quantity' => 'sometimes|numeric|min:0',
        ]);

        try {
            $batch = $this->inventoryService->updateRawMaterialBatch($rawMaterialBatch->id, $validated);

            return response()->json(['data' => $batch]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function destroyRawMaterialBatch(RawMaterialBatch $rawMaterialBatch): JsonResponse
    {
        try {
            $this->inventoryService->deleteRawMaterialBatch($rawMaterialBatch->id);

            return response()->json(null, 204);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}

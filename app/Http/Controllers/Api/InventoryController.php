<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
}

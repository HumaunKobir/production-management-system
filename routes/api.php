<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FinishedProductController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\ProductionController;
use App\Http\Controllers\Api\RawMaterialController;
use App\Http\Controllers\Api\RecipeController;
use App\Http\Controllers\Api\SemiFinishedProductController;
use App\Http\Controllers\Api\TraceabilityController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('inventory', [InventoryController::class, 'index']);
        Route::get('raw-materials', [RawMaterialController::class, 'index']);
        Route::get('raw-materials/{raw_material}', [RawMaterialController::class, 'show']);
        Route::get('semi-finished-products', [SemiFinishedProductController::class, 'index']);
        Route::get('semi-finished-products/{semi_finished_product}', [SemiFinishedProductController::class, 'show']);
        Route::get('finished-products', [FinishedProductController::class, 'index']);
        Route::get('finished-products/{finished_product}', [FinishedProductController::class, 'show']);

        Route::get('production', [ProductionController::class, 'index']);
        Route::get('production/{productionBatch}', [ProductionController::class, 'show']);
        Route::get('traceability/finished-batch/{finishedProductBatch}', [TraceabilityController::class, 'traceFinishedBatch']);

        Route::get('recipes/raw-to-semi', [RecipeController::class, 'indexRawToSemi']);
        Route::get('recipes/semi-to-finished', [RecipeController::class, 'indexSemiToFinished']);

        Route::middleware('role:admin,manager,operator')->group(function () {
            Route::post('inventory/receive', [InventoryController::class, 'receiveRawMaterial']);
            Route::post('production/raw-to-semi', [ProductionController::class, 'rawToSemi']);
            Route::post('production/semi-to-finished', [ProductionController::class, 'semiToFinished']);
        });

        Route::middleware('role:admin,manager')->group(function () {
            Route::put('inventory/raw-material-batches/{rawMaterialBatch}', [InventoryController::class, 'updateRawMaterialBatch']);
            Route::delete('inventory/raw-material-batches/{rawMaterialBatch}', [InventoryController::class, 'destroyRawMaterialBatch']);
            Route::put('production/{productionBatch}', [ProductionController::class, 'update']);
            Route::patch('production/{productionBatch}/status', [ProductionController::class, 'updateStatus']);
            Route::delete('production/{productionBatch}', [ProductionController::class, 'destroy']);

            Route::post('recipes/raw-to-semi', [RecipeController::class, 'storeRawToSemi']);
            Route::put('recipes/raw-to-semi/{rawToSemiRecipe}', [RecipeController::class, 'updateRawToSemi']);
            Route::delete('recipes/raw-to-semi/{rawToSemiRecipe}', [RecipeController::class, 'destroyRawToSemi']);
            Route::post('recipes/semi-to-finished', [RecipeController::class, 'storeSemiToFinished']);
            Route::put('recipes/semi-to-finished/{semiToFinishedRecipe}', [RecipeController::class, 'updateSemiToFinished']);
            Route::delete('recipes/semi-to-finished/{semiToFinishedRecipe}', [RecipeController::class, 'destroySemiToFinished']);

            Route::post('raw-materials', [RawMaterialController::class, 'store']);
            Route::put('raw-materials/{raw_material}', [RawMaterialController::class, 'update']);
            Route::patch('raw-materials/{raw_material}', [RawMaterialController::class, 'update']);
            Route::delete('raw-materials/{raw_material}', [RawMaterialController::class, 'destroy']);

            Route::post('semi-finished-products', [SemiFinishedProductController::class, 'store']);
            Route::put('semi-finished-products/{semi_finished_product}', [SemiFinishedProductController::class, 'update']);
            Route::patch('semi-finished-products/{semi_finished_product}', [SemiFinishedProductController::class, 'update']);
            Route::delete('semi-finished-products/{semi_finished_product}', [SemiFinishedProductController::class, 'destroy']);

            Route::post('finished-products', [FinishedProductController::class, 'store']);
            Route::put('finished-products/{finished_product}', [FinishedProductController::class, 'update']);
            Route::patch('finished-products/{finished_product}', [FinishedProductController::class, 'update']);
            Route::delete('finished-products/{finished_product}', [FinishedProductController::class, 'destroy']);
        });

        Route::middleware('role:admin')->group(function () {
            Route::apiResource('users', UserController::class);
        });
    });
});

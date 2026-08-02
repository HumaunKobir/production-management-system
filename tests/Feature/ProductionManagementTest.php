<?php

namespace Tests\Feature;

use App\Enums\ProductionStatus;
use App\Enums\UserRole;
use App\Models\FinishedProduct;
use App\Models\FinishedProductBatch;
use App\Models\RawMaterial;
use App\Models\RawMaterialBatch;
use App\Models\RawToSemiRecipe;
use App\Models\SemiFinishedProduct;
use App\Models\SemiFinishedBatch;
use App\Models\SemiToFinishedRecipe;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'role' => UserRole::Admin,
        ]);
    }

    public function test_unauthenticated_api_requests_are_rejected(): void
    {
        $this->getJson('/api/inventory')->assertUnauthorized();
    }

    public function test_can_receive_raw_material_and_view_inventory(): void
    {
        $material = RawMaterial::create([
            'name' => 'Steel Sheets',
            'sku' => 'RM-001',
            'unit' => 'kg',
        ]);

        $this->actingAs($this->user)
            ->postJson('/api/inventory/receive', [
                'raw_material_id' => $material->id,
                'quantity' => 100,
                'batch_number' => 'RM-TEST-001',
            ])
            ->assertCreated();

        $response = $this->actingAs($this->user)->getJson('/api/inventory');

        $response->assertOk()
            ->assertJsonPath('data.raw_materials.0.quantity', 100);
    }

    public function test_raw_to_semi_production_updates_inventory(): void
    {
        $raw = RawMaterial::create(['name' => 'Steel', 'sku' => 'RM-ST', 'unit' => 'kg']);
        $semi = SemiFinishedProduct::create(['name' => 'Rods', 'sku' => 'SF-RD', 'unit' => 'units']);

        RawToSemiRecipe::create([
            'raw_material_id' => $raw->id,
            'semi_finished_product_id' => $semi->id,
            'input_quantity_per_unit' => 2.5,
        ]);

        RawMaterialBatch::create([
            'raw_material_id' => $raw->id,
            'batch_number' => 'RM-B1',
            'quantity' => 100,
            'remaining_quantity' => 100,
            'received_at' => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/production/raw-to-semi', [
                'semi_finished_product_id' => $semi->id,
                'output_quantity' => 10,
            ]);

        $response->assertAccepted();

        $this->assertDatabaseHas('production_batches', [
            'status' => ProductionStatus::Completed->value,
            'output_quantity' => 10,
        ]);

        $this->assertEquals(75, RawMaterialBatch::first()->fresh()->remaining_quantity);
        $this->assertEquals(10, SemiFinishedBatch::first()->remaining_quantity);
    }

    public function test_production_rejected_when_insufficient_inventory(): void
    {
        $raw = RawMaterial::create(['name' => 'Steel', 'sku' => 'RM-ST2', 'unit' => 'kg']);
        $semi = SemiFinishedProduct::create(['name' => 'Rods', 'sku' => 'SF-RD2', 'unit' => 'units']);

        RawToSemiRecipe::create([
            'raw_material_id' => $raw->id,
            'semi_finished_product_id' => $semi->id,
            'input_quantity_per_unit' => 10,
        ]);

        RawMaterialBatch::create([
            'raw_material_id' => $raw->id,
            'batch_number' => 'RM-B2',
            'quantity' => 5,
            'remaining_quantity' => 5,
            'received_at' => now(),
        ]);

        $this->actingAs($this->user)
            ->postJson('/api/production/raw-to-semi', [
                'semi_finished_product_id' => $semi->id,
                'output_quantity' => 10,
            ])
            ->assertUnprocessable();
    }

    public function test_full_traceability_chain(): void
    {
        $raw = RawMaterial::create(['name' => 'Steel', 'sku' => 'RM-TR', 'unit' => 'kg']);
        $semi = SemiFinishedProduct::create(['name' => 'Rods', 'sku' => 'SF-TR', 'unit' => 'units']);
        $finished = FinishedProduct::create(['name' => 'Pipes', 'sku' => 'FP-TR', 'unit' => 'units']);

        RawToSemiRecipe::create([
            'raw_material_id' => $raw->id,
            'semi_finished_product_id' => $semi->id,
            'input_quantity_per_unit' => 2,
        ]);

        SemiToFinishedRecipe::create([
            'semi_finished_product_id' => $semi->id,
            'finished_product_id' => $finished->id,
            'input_quantity_per_unit' => 3,
        ]);

        RawMaterialBatch::create([
            'raw_material_id' => $raw->id,
            'batch_number' => 'RM-TR-1',
            'quantity' => 100,
            'remaining_quantity' => 100,
            'received_at' => now(),
        ]);

        $this->actingAs($this->user)->postJson('/api/production/raw-to-semi', [
            'semi_finished_product_id' => $semi->id,
            'output_quantity' => 10,
        ])->assertAccepted();

        $this->actingAs($this->user)->postJson('/api/production/semi-to-finished', [
            'finished_product_id' => $finished->id,
            'output_quantity' => 5,
        ])->assertAccepted();

        $finishedBatch = FinishedProductBatch::first();

        $response = $this->actingAs($this->user)
            ->getJson("/api/traceability/finished-batch/{$finishedBatch->id}");

        $response->assertOk()
            ->assertJsonPath('data.finished_product_batch.batch_number', $finishedBatch->batch_number)
            ->assertJsonStructure([
                'data' => [
                    'finished_product_batch',
                    'production_batch',
                    'semi_finished_sources' => [
                        '*' => [
                            'semi_finished_batch',
                            'raw_material_sources',
                        ],
                    ],
                ],
            ]);
    }

    public function test_recipe_crud(): void
    {
        $raw = RawMaterial::create(['name' => 'Wood', 'sku' => 'RM-WD', 'unit' => 'kg']);
        $semi = SemiFinishedProduct::create(['name' => 'Planks', 'sku' => 'SF-PL', 'unit' => 'units']);

        $this->actingAs($this->user)
            ->postJson('/api/recipes/raw-to-semi', [
                'raw_material_id' => $raw->id,
                'semi_finished_product_id' => $semi->id,
                'input_quantity_per_unit' => 1.5,
            ])
            ->assertCreated()
            ->assertJsonPath('data.input_quantity_per_unit', '1.5000');

        $this->actingAs($this->user)
            ->getJson('/api/recipes/raw-to-semi')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}

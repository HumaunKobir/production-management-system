<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\FinishedProduct;
use App\Models\RawMaterial;
use App\Models\RawMaterialBatch;
use App\Models\RawToSemiRecipe;
use App\Models\SemiFinishedProduct;
use App\Models\SemiToFinishedRecipe;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@pms.com'],
            [
                'name' => 'System Admin',
                'password' => bcrypt('password'),
                'role' => UserRole::Admin,
            ]
        );

        User::firstOrCreate(
            ['email' => 'manager@pms.com'],
            [
                'name' => 'Production Manager',
                'password' => bcrypt('password'),
                'role' => UserRole::Manager,
            ]
        );

        User::firstOrCreate(
            ['email' => 'operator@pms.com'],
            [
                'name' => 'Floor Operator',
                'password' => bcrypt('password'),
                'role' => UserRole::Operator,
            ]
        );

        $steelSheets = RawMaterial::firstOrCreate(
            ['sku' => 'RM-STEEL-SHEET'],
            [
                'name' => 'Steel Sheets',
                'description' => 'High-grade steel sheets for rod production',
                'unit' => 'kg',
            ]
        );

        $steelRods = SemiFinishedProduct::firstOrCreate(
            ['sku' => 'SF-STEEL-ROD'],
            [
                'name' => 'Steel Rods',
                'description' => 'Semi-finished steel rods',
                'unit' => 'units',
            ]
        );

        $steelPipes = FinishedProduct::firstOrCreate(
            ['sku' => 'FP-STEEL-PIPE'],
            [
                'name' => 'Steel Pipes',
                'description' => 'Finished steel pipes',
                'unit' => 'units',
            ]
        );

        RawToSemiRecipe::firstOrCreate(
            [
                'raw_material_id' => $steelSheets->id,
                'semi_finished_product_id' => $steelRods->id,
            ],
            ['input_quantity_per_unit' => 2.5]
        );

        SemiToFinishedRecipe::firstOrCreate(
            [
                'semi_finished_product_id' => $steelRods->id,
                'finished_product_id' => $steelPipes->id,
            ],
            ['input_quantity_per_unit' => 3]
        );

        RawMaterialBatch::firstOrCreate(
            ['batch_number' => 'RM-BATCH-001'],
            [
                'raw_material_id' => $steelSheets->id,
                'quantity' => 1000,
                'remaining_quantity' => 1000,
                'received_at' => now()->subDays(5),
            ]
        );

        RawMaterialBatch::firstOrCreate(
            ['batch_number' => 'RM-BATCH-002'],
            [
                'raw_material_id' => $steelSheets->id,
                'quantity' => 500,
                'remaining_quantity' => 500,
                'received_at' => now()->subDays(2),
            ]
        );
    }
}

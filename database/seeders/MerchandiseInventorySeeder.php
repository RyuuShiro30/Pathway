<?php

namespace Database\Seeders;

use App\Models\MerchandiseInventory;
use Illuminate\Database\Seeder;

class MerchandiseInventorySeeder extends Seeder
{
    public function run(): void
    {
        $merchandises = [
            [
                'name' => 'Tumbler Pathway',
                'description' => 'Tumbler stainless 500 ml dengan logo Pathway.',
                'point_cost' => 300,
                'image_url' => null,
                'stock' => 12,
            ],
            [
                'name' => 'Totebag Kanvas Pathway',
                'description' => 'Totebag kanvas ramah lingkungan untuk kebutuhan harian.',
                'point_cost' => 250,
                'image_url' => null,
                'stock' => 8,
            ],
            [
                'name' => 'Sticker Pack Pathway',
                'description' => 'Satu set stiker eksklusif untuk laptop dan catatan.',
                'point_cost' => 100,
                'image_url' => null,
                'stock' => 20,
            ],
            [
                'name' => 'Kaos Pathway',
                'description' => 'Kaos katun premium bertema komunitas Pathway.',
                'point_cost' => 500,
                'image_url' => null,
                'stock' => 5,
            ],
        ];

        foreach ($merchandises as $merchandise) {
            MerchandiseInventory::query()->updateOrCreate(
                ['name' => $merchandise['name']],
                $merchandise
            );
        }
    }
}

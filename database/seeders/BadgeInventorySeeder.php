<?php

namespace Database\Seeders;

use App\Models\BadgeInventory;
use Illuminate\Database\Seeder;

class BadgeInventorySeeder extends Seeder
{
    public function run(): void
    {
        $badges = [
            [
                'name' => 'Badge Java',
                'description' => 'Badge apresiasi keahlian Java.',
                'point_cost' => 500,
                'image_url' => null,
            ],
            [
                'name' => 'Badge HTML',
                'description' => 'Badge apresiasi keahlian HTML.',
                'point_cost' => 500,
                'image_url' => null,
            ],
            [
                'name' => 'Badge CSS',
                'description' => 'Badge apresiasi keahlian CSS.',
                'point_cost' => 500,
                'image_url' => null,
            ],
            [
                'name' => 'Badge Data Mining',
                'description' => 'Badge apresiasi keahlian Data Mining.',
                'point_cost' => 500,
                'image_url' => null,
            ],
            [
                'name' => 'Badge RPL',
                'description' => 'Badge apresiasi keahlian Rekayasa Perangkat Lunak.',
                'point_cost' => 500,
                'image_url' => null,
            ],
        ];

        foreach ($badges as $badge) {
            BadgeInventory::updateOrCreate(
                ['name' => $badge['name']],
                $badge
            );
        }
    }
}

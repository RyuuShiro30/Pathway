<?php

namespace Database\Factories;

use App\Models\MerchandiseInventory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MerchandiseInventory>
 */
class MerchandiseInventoryFactory extends Factory
{
    protected $model = MerchandiseInventory::class;

    public function definition(): array
    {
        return [
            'name' => 'Merchandise '.fake()->unique()->word(),
            'description' => fake()->sentence(),
            'point_cost' => fake()->numberBetween(100, 1000),
            'image_url' => null,
            'stock' => fake()->numberBetween(1, 50),
        ];
    }
}

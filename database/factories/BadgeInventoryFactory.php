<?php

namespace Database\Factories;

use App\Models\BadgeInventory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BadgeInventory>
 */
class BadgeInventoryFactory extends Factory
{
    protected $model = BadgeInventory::class;

    public function definition(): array
    {
        return [
            'name' => 'Badge '.fake()->unique()->word(),
            'description' => fake()->sentence(),
            'point_cost' => fake()->numberBetween(100, 1000),
            'image_url' => null,
        ];
    }
}

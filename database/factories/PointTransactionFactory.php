<?php

namespace Database\Factories;

use App\Models\PointTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PointTransaction>
 */
class PointTransactionFactory extends Factory
{
    protected $model = PointTransaction::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->mentor(),
            'amount' => fake()->numberBetween(50, 500),
            'transaction_type' => 'earned_mentoring',
            'description' => 'Poin dari sesi mentoring selesai.',
            'related_id' => null,
        ];
    }

    public function adminBonus(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'admin_bonus',
            'description' => 'Bonus poin dari admin.',
        ]);
    }

    public function redeemedBadge(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'redeemed_badge',
            'description' => 'Penukaran badge.',
        ]);
    }

    public function redeemedMerchandise(): static
    {
        return $this->state(fn (array $attributes) => [
            'transaction_type' => 'redeemed_merchandise',
            'description' => 'Penukaran merchandise.',
        ]);
    }
}

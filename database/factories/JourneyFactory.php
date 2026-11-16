<?php

namespace Database\Factories;

use App\Models\Journey;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Journey>
 */
class JourneyFactory extends Factory
{
    protected $model = Journey::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(4);

        return [
            'author_id' => User::factory()->student(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'content' => fake()->paragraphs(3, true),
            'likes_count' => 0,
            'status' => Journey::STATUS_PUBLISHED,
            'moderation_note' => null,
            'allow_comments' => true,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Journey::STATUS_DRAFT,
        ]);
    }

    public function menunggu(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Journey::STATUS_MENUNGGU,
        ]);
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Journey::STATUS_PUBLISHED,
        ]);
    }

    public function ditolak(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Journey::STATUS_DITOLAK,
            'moderation_note' => fake()->sentence(),
        ]);
    }
}

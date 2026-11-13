<?php

namespace Tests\Feature;

use App\Models\MentorProfile;
use App\Models\MerchandiseInventory;
use App\Models\User;
use App\Models\UserMerchandise;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MerchandiseHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_see_their_own_merchandise_history(): void
    {
        $mentor = $this->createMentor();

        $merchandise = $this->createMerchandise();

        UserMerchandise::query()->create([
            'user_id' => $mentor->id,
            'merchandise_id' => $merchandise->id,
            'quantity' => 2,
            'points_spent' => 40,
            'recipient_name' => 'Andi Pratama',
            'phone_number' => '081234567890',
            'shipping_address' => 'Malang, Jawa Timur',
            'shipping_status' => 'menunggu',
            'redeemed_at' => now(),
        ]);

        $response = $this->actingAs($mentor)
            ->get(route('mentor.merchandise.history'));

        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Mentor/Merchandise/History')
            ->has('history', 1)
            ->where('history.0.user_id', $mentor->id)
            ->where('history.0.merchandise.name', 'Kaos Pathway')
            ->where('history.0.quantity', 2)
            ->where('history.0.points_spent', 40)
        );
    }

    public function test_mentor_cannot_see_another_mentors_merchandise_history(): void
    {
        $mentor = $this->createMentor();
        $anotherMentor = $this->createMentor();

        $merchandise = $this->createMerchandise();

        UserMerchandise::query()->create([
            'user_id' => $anotherMentor->id,
            'merchandise_id' => $merchandise->id,
            'quantity' => 1,
            'points_spent' => 20,
            'recipient_name' => 'Mentor Lain',
            'phone_number' => '081111111111',
            'shipping_address' => 'Surabaya, Jawa Timur',
            'shipping_status' => 'menunggu',
            'redeemed_at' => now(),
        ]);

        $response = $this->actingAs($mentor)
            ->get(route('mentor.merchandise.history'));

        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Mentor/Merchandise/History')
            ->has('history', 0)
        );
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->mentor()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);

        return $mentor;
    }

    private function createMerchandise(): MerchandiseInventory
    {
        return MerchandiseInventory::query()->create([
            'name' => 'Kaos Pathway',
            'description' => 'Kaos merchandise Pathway',
            'point_cost' => 20,
            'stock' => 10,
        ]);
    }
}

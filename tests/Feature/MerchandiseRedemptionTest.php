<?php

namespace Tests\Feature;

use App\Models\MentorProfile;
use App\Models\MerchandiseInventory;
use App\Models\PointTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MerchandiseRedemptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_redeem_merchandise_successfully(): void
    {
        $mentor = $this->createMentor();

        $merchandise = MerchandiseInventory::query()->create([
            'name' => 'Kaos Pathway',
            'description' => 'Kaos merchandise Pathway',
            'point_cost' => 20,
            'stock' => 10,
        ]);

        $this->givePoints($mentor, 100);

        $response = $this->actingAs($mentor)
            ->from(route('mentor.merchandise.index'))
            ->post(route('mentor.merchandise.redeem', $merchandise->id), [
                'quantity' => 2,
                'recipient_name' => 'Andi Pratama',
                'phone_number' => '081234567890',
                'shipping_address' => 'Malang, Jawa Timur',
            ]);

        $response->assertRedirect(route('mentor.merchandise.index'));

        $response->assertSessionHas(
            'success',
            'Merchandise berhasil ditukar! Pesanan menunggu diproses.'
        );

        $this->assertDatabaseHas('user_merchandise', [
            'user_id' => $mentor->id,
            'merchandise_id' => $merchandise->id,
            'quantity' => 2,
            'points_spent' => 40,
            'recipient_name' => 'Andi Pratama',
            'phone_number' => '081234567890',
            'shipping_address' => 'Malang, Jawa Timur',
            'shipping_status' => 'menunggu',
        ]);

        $this->assertDatabaseHas('point_transactions', [
            'user_id' => $mentor->id,
            'amount' => 40,
            'transaction_type' => 'redeemed_merchandise',
            'related_id' => $merchandise->id,
        ]);

        $this->assertDatabaseHas('merchandise_inventory', [
            'id' => $merchandise->id,
            'stock' => 8,
        ]);
    }

    public function test_mentor_cannot_redeem_merchandise_with_insufficient_points(): void
    {
        $mentor = $this->createMentor();

        $merchandise = MerchandiseInventory::query()->create([
            'name' => 'Tas Pathway',
            'description' => 'Tas merchandise Pathway',
            'point_cost' => 50,
            'stock' => 10,
        ]);

        $this->givePoints($mentor, 20);

        $response = $this->actingAs($mentor)
            ->from(route('mentor.merchandise.index'))
            ->post(route('mentor.merchandise.redeem', $merchandise->id), [
                'quantity' => 1,
                'recipient_name' => 'Andi Pratama',
                'phone_number' => '081234567890',
                'shipping_address' => 'Malang, Jawa Timur',
            ]);

        $response->assertRedirect(route('mentor.merchandise.index'));
        $response->assertSessionHasErrors('quantity');

        $this->assertDatabaseCount('user_merchandise', 0);

        $this->assertDatabaseMissing('point_transactions', [
            'user_id' => $mentor->id,
            'transaction_type' => 'redeemed_merchandise',
        ]);

        $this->assertDatabaseHas('merchandise_inventory', [
            'id' => $merchandise->id,
            'stock' => 10,
        ]);
    }

    public function test_mentor_cannot_redeem_merchandise_when_stock_is_insufficient(): void
    {
        $mentor = $this->createMentor();

        $merchandise = MerchandiseInventory::query()->create([
            'name' => 'Topi Pathway',
            'description' => 'Topi merchandise Pathway',
            'point_cost' => 10,
            'stock' => 1,
        ]);

        $this->givePoints($mentor, 100);

        $response = $this->actingAs($mentor)
            ->from(route('mentor.merchandise.index'))
            ->post(route('mentor.merchandise.redeem', $merchandise->id), [
                'quantity' => 2,
                'recipient_name' => 'Andi Pratama',
                'phone_number' => '081234567890',
                'shipping_address' => 'Malang, Jawa Timur',
            ]);

        $response->assertRedirect(route('mentor.merchandise.index'));
        $response->assertSessionHasErrors('quantity');

        $this->assertDatabaseCount('user_merchandise', 0);

        $this->assertDatabaseMissing('point_transactions', [
            'user_id' => $mentor->id,
            'transaction_type' => 'redeemed_merchandise',
        ]);

        $this->assertDatabaseHas('merchandise_inventory', [
            'id' => $merchandise->id,
            'stock' => 1,
        ]);
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->create([
            'role' => 'mentor',
        ]);

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);

        return $mentor;
    }

    private function givePoints(User $mentor, int $amount): void
    {
        PointTransaction::query()->create([
            'user_id' => $mentor->id,
            'amount' => $amount,
            'transaction_type' => 'earned_mentoring',
            'description' => 'Poin awal untuk pengujian.',
        ]);
    }
}

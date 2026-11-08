<?php

namespace Tests\Feature;

use App\Models\BadgeInventory;
use App\Models\MentorProfile;
use App\Models\PointTransaction;
use App\Models\User;
use App\Models\UserBadge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BadgeRedemptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_redeem_badge_successfully(): void
    {
        $mentor = $this->createMentor();

        $badge = BadgeInventory::query()->create([
            'name' => 'Badge Pemula',
            'description' => 'Badge untuk mentor pemula.',
            'point_cost' => 20,
        ]);

        $this->givePoints($mentor, 100);

        $response = $this->actingAs($mentor)
            ->from(route('mentor.badges.index'))
            ->post(route('mentor.badges.redeem', $badge->id));

        $response->assertRedirect(route('mentor.badges.index'));
        $response->assertSessionHas('success', 'Badge berhasil ditukar!');

        $this->assertDatabaseHas('user_badges', [
            'user_id' => $mentor->id,
            'badge_id' => $badge->id,
        ]);

        $this->assertDatabaseHas('point_transactions', [
            'user_id' => $mentor->id,
            'amount' => 20,
            'transaction_type' => 'redeemed_badge',
            'related_id' => $badge->id,
        ]);
    }

    public function test_mentor_cannot_redeem_badge_with_insufficient_points(): void
    {
        $mentor = $this->createMentor();

        $badge = BadgeInventory::query()->create([
            'name' => 'Badge Expert',
            'description' => 'Badge untuk mentor expert.',
            'point_cost' => 100,
        ]);

        $this->givePoints($mentor, 20);

        $response = $this->actingAs($mentor)
            ->from(route('mentor.badges.index'))
            ->post(route('mentor.badges.redeem', $badge->id));

        $response->assertRedirect(route('mentor.badges.index'));
        $response->assertSessionHas(
            'error',
            'Poin kamu belum cukup untuk menukar badge ini.'
        );

        $this->assertDatabaseCount('user_badges', 0);

        $this->assertDatabaseMissing('point_transactions', [
            'user_id' => $mentor->id,
            'transaction_type' => 'redeemed_badge',
        ]);
    }

    public function test_mentor_cannot_redeem_badge_that_is_already_owned(): void
    {
        $mentor = $this->createMentor();

        $badge = BadgeInventory::query()->create([
            'name' => 'Badge Konsisten',
            'description' => 'Badge untuk mentor konsisten.',
            'point_cost' => 20,
        ]);

        $this->givePoints($mentor, 100);

        UserBadge::query()->create([
            'user_id' => $mentor->id,
            'badge_id' => $badge->id,
            'redeemed_at' => now(),
        ]);

        $response = $this->actingAs($mentor)
            ->from(route('mentor.badges.index'))
            ->post(route('mentor.badges.redeem', $badge->id));

        $response->assertRedirect(route('mentor.badges.index'));
        $response->assertSessionHas(
            'error',
            'Badge ini sudah kamu miliki.'
        );

        $this->assertDatabaseCount('user_badges', 1);

        $this->assertDatabaseMissing('point_transactions', [
            'user_id' => $mentor->id,
            'transaction_type' => 'redeemed_badge',
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

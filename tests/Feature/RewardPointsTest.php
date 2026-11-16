<?php

namespace Tests\Feature;

use App\Models\BadgeInventory;
use App\Models\MentorProfile;
use App\Models\MerchandiseInventory;
use App\Models\PointTransaction;
use App\Models\User;
use App\Models\UserBadge;
use App\Services\PointService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RewardPointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_view_reward_hub_with_balance_and_catalogs(): void
    {
        $mentor = $this->createMentor();

        $ownedBadge = BadgeInventory::query()->create([
            'name' => 'Badge Pemula',
            'description' => 'Badge untuk mentor pemula.',
            'point_cost' => 20,
        ]);

        BadgeInventory::query()->create([
            'name' => 'Badge Expert',
            'description' => 'Badge untuk mentor expert.',
            'point_cost' => 50,
        ]);

        MerchandiseInventory::query()->create([
            'name' => 'Kaos Pathway',
            'description' => 'Kaos merchandise Pathway',
            'point_cost' => 40,
            'stock' => 5,
        ]);

        UserBadge::query()->create([
            'user_id' => $mentor->id,
            'badge_id' => $ownedBadge->id,
            'redeemed_at' => now(),
        ]);

        $this->givePoints($mentor, 30);

        $response = $this->actingAs($mentor)
            ->get(route('mentor.rewards.index'));

        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Mentor/Rewards/Index')
            ->has('badges', 2)
            ->has('merchandises', 1)
            ->where('pointsBalance', 30)
            ->where('currentTab', 'badge')
            ->where('badges.0.is_owned', true)
            ->where('badges.1.is_owned', false)
            ->where('merchandises.0.name', 'Kaos Pathway')
        );

        $response = $this->actingAs($mentor)
            ->get(route('mentor.rewards.index', ['tab' => 'merchandise']));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Mentor/Rewards/Index')
            ->where('currentTab', 'merchandise')
        );
    }

    public function test_mentor_can_view_point_history(): void
    {
        $mentor = $this->createMentor();

        PointTransaction::query()->forceCreate([
            'user_id' => $mentor->id,
            'amount' => 100,
            'transaction_type' => 'earned_mentoring',
            'description' => 'Poin sesi mentoring.',
            'related_id' => null,
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        PointTransaction::query()->forceCreate([
            'user_id' => $mentor->id,
            'amount' => 20,
            'transaction_type' => 'redeemed_badge',
            'description' => 'Penukaran badge: Badge Pemula',
            'related_id' => null,
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($mentor)
            ->get(route('mentor.points.history'));

        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Mentor/Points/History')
            ->where('pointsBalance', 80)
            ->has('transactions', 2)
            ->where('transactions.0.transaction_type', 'redeemed_badge')
            ->where('transactions.0.is_earning', false)
            ->where('transactions.1.transaction_type', 'earned_mentoring')
            ->where('transactions.1.is_earning', true)
        );
    }

    public function test_admin_can_award_bonus_points_to_a_mentor(): void
    {
        $admin = User::factory()->admin()->create();
        $mentor = $this->createMentor();

        $this->givePoints($mentor, 30);

        $response = $this->actingAs($admin)
            ->get(route('admin.point-bonuses.index'));

        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Point/Index')
            ->has('mentors.data', 1)
            ->where('mentors.data.0.id', $mentor->id)
            ->where('mentors.data.0.points_balance', 30)
        );

        $response = $this->actingAs($admin)
            ->from(route('admin.point-bonuses.index'))
            ->post(route('admin.point-bonuses.store'), [
                'user_id' => $mentor->id,
                'amount' => 50,
                'description' => 'Bonus kontribusi komunitas.',
            ]);

        $response->assertRedirect(route('admin.point-bonuses.index'));
        $response->assertSessionHas(
            'success',
            'Poin bonus berhasil ditambahkan ke mentor.'
        );

        $this->assertDatabaseHas('point_transactions', [
            'user_id' => $mentor->id,
            'amount' => 50,
            'transaction_type' => 'admin_bonus',
            'description' => 'Bonus kontribusi komunitas.',
        ]);

        $this->assertSame(
            80,
            app(PointService::class)->balanceFor($mentor->id)
        );
    }

    public function test_admin_bonus_requires_a_mentor_and_valid_amount(): void
    {
        $admin = User::factory()->admin()->create();
        $student = User::factory()->student()->create();

        $response = $this->actingAs($admin)
            ->from(route('admin.point-bonuses.index'))
            ->post(route('admin.point-bonuses.store'), [
                'user_id' => $student->id,
                'amount' => 0,
                'description' => '',
            ]);

        $response->assertRedirect(route('admin.point-bonuses.index'));
        $response->assertSessionHasErrors([
            'user_id',
            'amount',
            'description',
        ]);

        $this->assertDatabaseMissing('point_transactions', [
            'transaction_type' => 'admin_bonus',
        ]);
    }

    public function test_non_admin_cannot_access_bonus_points(): void
    {
        $mentor = $this->createMentor();

        $this->actingAs($mentor)
            ->get(route('admin.point-bonuses.index'))
            ->assertNotFound();

        $this->actingAs($mentor)
            ->post(route('admin.point-bonuses.store'), [
                'user_id' => $mentor->id,
                'amount' => 50,
                'description' => 'Bonus.',
            ])
            ->assertNotFound();

        $this->assertDatabaseMissing('point_transactions', [
            'transaction_type' => 'admin_bonus',
        ]);
    }

    public function test_redeem_with_exact_balance_leaves_zero_points(): void
    {
        $mentor = $this->createMentor();

        $badge = BadgeInventory::query()->create([
            'name' => 'Badge Konsisten',
            'description' => 'Badge untuk mentor konsisten.',
            'point_cost' => 20,
        ]);

        $this->givePoints($mentor, 20);

        $response = $this->actingAs($mentor)
            ->from(route('mentor.rewards.index'))
            ->post(route('mentor.badges.redeem', $badge->id));

        $response->assertRedirect(route('mentor.rewards.index'));
        $response->assertSessionHas('success', 'Badge berhasil ditukar!');

        $this->assertDatabaseHas('user_badges', [
            'user_id' => $mentor->id,
            'badge_id' => $badge->id,
        ]);

        $this->assertSame(
            0,
            app(PointService::class)->balanceFor($mentor->id)
        );
    }

    public function test_failed_second_redemption_never_makes_balance_negative(): void
    {
        $mentor = $this->createMentor();

        $badge = BadgeInventory::query()->create([
            'name' => 'Badge Pemula',
            'description' => 'Badge untuk mentor pemula.',
            'point_cost' => 20,
        ]);

        $merchandise = MerchandiseInventory::query()->create([
            'name' => 'Topi Pathway',
            'description' => 'Topi merchandise Pathway',
            'point_cost' => 20,
            'stock' => 5,
        ]);

        $this->givePoints($mentor, 20);

        $this->actingAs($mentor)
            ->from(route('mentor.rewards.index'))
            ->post(route('mentor.badges.redeem', $badge->id))
            ->assertSessionHas('success');

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

        $this->assertDatabaseHas('merchandise_inventory', [
            'id' => $merchandise->id,
            'stock' => 5,
        ]);

        $this->assertSame(
            0,
            app(PointService::class)->balanceFor($mentor->id)
        );

        $this->assertDatabaseCount('point_transactions', 2);
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

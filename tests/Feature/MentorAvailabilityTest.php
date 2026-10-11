<?php

namespace Tests\Feature;

use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MentorAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_can_save_free_slot_with_null_price(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    [
                        'day' => 'senin',
                        'start' => '09:00',
                        'end' => '11:00',
                        'type' => 'gratis',
                        'price' => 50000,
                    ],
                ],
            ],
        );

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertSame([
            [
                'day' => 'senin',
                'start' => '09:00',
                'end' => '11:00',
                'type' => 'gratis',
                'price' => null,
            ],
        ], $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_can_save_free_slot_with_price_below_paid_minimum(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    [
                        'day' => 'senin',
                        'start' => '09:00',
                        'end' => '11:00',
                        'type' => 'gratis',
                        'price' => 500,
                    ],
                ],
            ],
        );

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertSame([
            [
                'day' => 'senin',
                'start' => '09:00',
                'end' => '11:00',
                'type' => 'gratis',
                'price' => null,
            ],
        ], $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_can_save_paid_slot_with_valid_price(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    [
                        'day' => 'senin',
                        'start' => '09:00',
                        'end' => '11:00',
                        'type' => 'berbayar',
                        'price' => 50000,
                    ],
                ],
            ],
        );

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertSame([
            [
                'day' => 'senin',
                'start' => '09:00',
                'end' => '11:00',
                'type' => 'berbayar',
                'price' => 50000,
            ],
        ], $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_cannot_save_paid_slot_without_price(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    [
                        'day' => 'senin',
                        'start' => '09:00',
                        'end' => '11:00',
                        'type' => 'berbayar',
                    ],
                ],
            ],
        );

        $response->assertSessionHasErrors([
            'availability_schedule.0.price' => 'Harga wajib diisi untuk slot berbayar.',
        ]);
        $this->assertSame([], $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_cannot_save_paid_slot_with_price_below_minimum(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    [
                        'day' => 'senin',
                        'start' => '09:00',
                        'end' => '11:00',
                        'type' => 'berbayar',
                        'price' => 999,
                    ],
                ],
            ],
        );

        $response->assertSessionHasErrors([
            'availability_schedule.0.price' => 'Harga slot berbayar minimal Rp 1.000.',
        ]);
        $this->assertSame([], $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_cannot_save_slot_with_unsupported_type(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    [
                        'day' => 'senin',
                        'start' => '09:00',
                        'end' => '11:00',
                        'type' => 'premium',
                        'price' => 50000,
                    ],
                ],
            ],
        );

        $response->assertSessionHasErrors([
            'availability_schedule.0.type' => 'Tipe slot harus Gratis atau Berbayar.',
        ]);
        $this->assertSame([], $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_can_clear_all_availability_slots(): void
    {
        $user = User::factory()->create();
        $mentorProfile = MentorProfile::create([
            'user_id' => $user->id,
            'expertise' => 'Web Development',
            'availability_schedule' => [
                ['day' => 'senin', 'start' => '09:00', 'end' => '11:00'],
            ],
        ]);

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            ['availability_schedule' => []],
        );

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertSame([], $mentorProfile->fresh()->availability_schedule);
    }

    /**
     * @return array{0: User, 1: MentorProfile}
     */
    private function createMentorProfile(): array
    {
        $user = User::factory()->create();
        $mentorProfile = MentorProfile::create([
            'user_id' => $user->id,
            'expertise' => 'Web Development',
            'availability_schedule' => [],
        ]);

        return [$user, $mentorProfile];
    }
}
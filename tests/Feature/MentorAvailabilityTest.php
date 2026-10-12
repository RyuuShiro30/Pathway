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

    public function test_mentor_cannot_save_overlapping_slots_on_the_same_day(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();
        $existingSchedule = [
            ['day' => 'senin', 'start' => '08:00', 'end' => '09:00', 'type' => 'gratis', 'price' => null],
        ];
        $mentorProfile->update(['availability_schedule' => $existingSchedule]);

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
                    ['day' => 'senin', 'start' => '10:00', 'end' => '12:00', 'type' => 'gratis', 'price' => null],
                ],
            ],
        );

        $response->assertSessionHasErrors([
            'availability_schedule' => 'Jadwal pada hari Senin saling tumpang tindih: 09:00-11:00 dan 10:00-12:00.',
        ]);
        $this->assertSame($existingSchedule, $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_can_save_slots_that_only_touch_at_the_boundary(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
                    ['day' => 'senin', 'start' => '11:00', 'end' => '13:00', 'type' => 'gratis', 'price' => null],
                ],
            ],
        );

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertSame([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
            ['day' => 'senin', 'start' => '11:00', 'end' => '13:00', 'type' => 'gratis', 'price' => null],
        ], $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_can_save_same_hours_on_different_days(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
                    ['day' => 'selasa', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
                ],
            ],
        );

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertSame([
            ['day' => 'senin', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
            ['day' => 'selasa', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
        ], $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_cannot_save_identical_slots(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();
        $duplicateSlot = [
            'day' => 'senin',
            'start' => '09:00',
            'end' => '11:00',
            'type' => 'gratis',
            'price' => null,
        ];

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            ['availability_schedule' => [$duplicateSlot, $duplicateSlot]],
        );

        $response->assertSessionHasErrors([
            'availability_schedule' => 'Jadwal pada hari Senin saling tumpang tindih: 09:00-11:00 dan 09:00-11:00.',
        ]);
        $this->assertSame([], $mentorProfile->fresh()->availability_schedule);
    }

    public function test_mentor_cannot_save_slot_with_invalid_day(): void
    {
        [$user, $mentorProfile] = $this->createMentorProfile();

        $response = $this->actingAs($user)->patch(
            route('mentor.availability.update'),
            [
                'availability_schedule' => [
                    ['day' => 'monday', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
                ],
            ],
        );

        $response->assertSessionHasErrors([
            'availability_schedule.0.day' => 'Hari harus salah satu dari Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, atau Minggu.',
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

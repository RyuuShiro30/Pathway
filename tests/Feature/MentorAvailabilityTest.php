<?php

namespace Tests\Feature;

use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MentorAvailabilityTest extends TestCase
{
    use RefreshDatabase;

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
}
<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_with_confirmed_session_sees_upcoming_schedule_on_dashboard(): void
    {
        $student = User::factory()->student()->create();

        $mentor = User::factory()->mentor()->create([
            'name' => 'Mentor Hebat',
        ]);

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);

        $confirmedSession = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => now()->addDays(2),
            'end_time' => now()->addDays(2)->addHour(),
            'duration_hours' => 1,
            'notes_from_student' => 'Diskusi skripsi',
            'discord_link' => 'https://discord.gg/mentor-room',
            'is_free_session' => true,
            'price_snapshot' => 0,
        ]);

        $response = $this->actingAs($student)->get('/dashboard');

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('lastBooking')
                ->where('lastBooking.id', $confirmedSession->id)
                ->where('lastBooking.status', 'dikonfirmasi')
                ->where('lastBooking.mentor.name', 'Mentor Hebat')
            );
    }
}

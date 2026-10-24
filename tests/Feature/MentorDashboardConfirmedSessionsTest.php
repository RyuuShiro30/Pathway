<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MentorDashboardConfirmedSessionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_lists_only_own_confirmed_and_ongoing_sessions_ordered_by_schedule(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        $mentor = $this->createMentor();
        $otherMentor = $this->createMentor();
        $student = User::factory()->create();

        $later = $this->createSession($mentor, $student, 'dikonfirmasi', now()->addDays(2));
        $sooner = $this->createSession($mentor, $student, 'berlangsung', now()->addDay());

        $this->createSession($mentor, $student, 'diajukan', now()->addDays(3));
        $this->createSession($mentor, $student, 'selesai', now()->subDay());
        $this->createSession($mentor, $student, 'dibatalkan', now()->addDays(4));
        $this->createSession($otherMentor, $student, 'dikonfirmasi', now()->addDays(2));

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mentor/Dashboard')
                ->has('confirmedSessions', 2)
                ->where('confirmedSessions.0.id', $sooner->id)
                ->where('confirmedSessions.0.status', 'berlangsung')
                ->where('confirmedSessions.1.id', $later->id)
                ->where('confirmedSessions.1.status', 'dikonfirmasi')
                ->where('confirmedSessions.0.student.name', $student->name)
                ->missing('confirmedSessions.0.student.email'));
    }

    public function test_confirmed_sessions_is_empty_when_mentor_has_none(): void
    {
        $mentor = $this->createMentor();

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('confirmedSessions', 0));
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);

        return $mentor;
    }

    private function createSession(
        User $mentor,
        User $student,
        string $status,
        Carbon $scheduleTime,
    ): MentoringSession {
        return MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => $status,
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);
    }
}

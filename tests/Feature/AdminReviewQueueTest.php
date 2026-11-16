<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\MentorSuspension;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminReviewQueueTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_counts_unresolved_sessions(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $admin = $this->createAdmin();
        $mentor = $this->createMentor();

        $this->createSession($mentor, ['status' => 'berlangsung']);
        $this->createSession($mentor, [
            'status' => 'dikonfirmasi',
            'end_time' => now()->subHour(),
        ]);
        $this->createSession($mentor, [
            'status' => 'dikonfirmasi',
            'end_time' => now()->addHour(),
        ]);
        $this->createSession($mentor, [
            'status' => 'selesai',
            'end_time' => now()->subHour(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('reviewQueue.unresolved_sessions', 2));
    }

    public function test_dashboard_counts_active_suspensions_only(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $admin = $this->createAdmin();
        $suspended = $this->createMentor();
        $lifted = $this->createMentor();

        MentorSuspension::query()->create([
            'mentor_id' => $suspended->id,
            'reason' => MentorSuspension::REASON_NO_SHOW,
            'suspended_at' => now()->subHour(),
        ]);

        MentorSuspension::query()->create([
            'mentor_id' => $lifted->id,
            'reason' => MentorSuspension::REASON_MANUAL,
            'suspended_at' => now()->subDays(2),
            'lifted_at' => now()->subDay(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Dashboard')
                ->where('reviewQueue.active_suspensions', 1));
    }

    public function test_review_queue_keeps_existing_case_counts(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $admin = $this->createAdmin();
        $mentor = $this->createMentor();

        MentorProfile::query()->where('user_id', $mentor->id)->update([
            'verification_status' => 'pending',
        ]);
        $this->createSession($mentor, ['refund_status' => 'dilaporkan']);
        $this->createSession($mentor, ['status' => 'berlangsung']);

        $this->actingAs($admin)
            ->get(route('admin.dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('reviewQueue.pending_mentors', 1)
                ->where('reviewQueue.refund_reports', 1)
                ->where('reviewQueue.no_show_disputes', 0)
                ->where('reviewQueue.unresolved_sessions', 1)
                ->where('reviewQueue.active_suspensions', 0));
    }

    public function test_sessions_page_defaults_to_unresolved_sessions(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $admin = $this->createAdmin();
        $mentor = $this->createMentor();

        $running = $this->createSession($mentor, ['status' => 'berlangsung']);
        $overdue = $this->createSession($mentor, [
            'status' => 'dikonfirmasi',
            'end_time' => now()->subHour(),
        ]);
        $this->createSession($mentor, [
            'status' => 'dikonfirmasi',
            'end_time' => now()->addHour(),
        ]);
        $this->createSession($mentor, ['status' => 'dibatalkan']);

        $this->actingAs($admin)
            ->get(route('admin.sessions.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Session/Index', false)
                ->where('currentStatus', 'belum_selesai')
                ->has('sessions', 2)
                ->where('sessions.0.id', $running->id)
                ->where('sessions.1.id', $overdue->id)
                ->where('counts.belum_selesai', 2)
                ->where('counts.dibatalkan', 1)
                ->where('counts.semua', 4));
    }

    public function test_sessions_page_filters_by_single_status(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $admin = $this->createAdmin();
        $mentor = $this->createMentor();

        $this->createSession($mentor, ['status' => 'berlangsung']);
        $finished = $this->createSession($mentor, ['status' => 'selesai']);

        $this->actingAs($admin)
            ->get(route('admin.sessions.index', ['status' => 'selesai']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('currentStatus', 'selesai')
                ->has('sessions', 1)
                ->where('sessions.0.id', $finished->id)
                ->where('sessions.0.is_overdue', false));
    }

    public function test_sessions_page_marks_overdue_confirmed_session(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $admin = $this->createAdmin();
        $mentor = $this->createMentor();

        $this->createSession($mentor, [
            'status' => 'dikonfirmasi',
            'end_time' => now()->subHour(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.sessions.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('sessions.0.is_overdue', true));
    }

    public function test_sessions_page_is_admin_only(): void
    {
        $student = $this->createStudent();

        $this->get(route('admin.sessions.index'))
            ->assertRedirect(route('admin.login'));

        $this->actingAs($student)
            ->get(route('admin.sessions.index'))
            ->assertNotFound();
    }

    private function createAdmin(): User
    {
        return User::factory()->admin()->create();
    }

    private function createStudent(): User
    {
        return User::factory()->student()->create();
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

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createSession(User $mentor, array $overrides = []): MentoringSession
    {
        $scheduleTime = now()->addDays(3)->setTime(9, 0);

        return MentoringSession::query()->create(array_merge([
            'student_id' => $this->createStudent()->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ], $overrides));
    }
}

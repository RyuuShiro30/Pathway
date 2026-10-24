<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class MentorDashboardCancelledTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_only_includes_recent_student_cancelled_sessions_for_logged_in_mentor(): void
    {
        $mentor = $this->createMentor();
        $otherMentor = $this->createMentor();
        $student = User::factory()->create();

        $ownSession = $this->createSession($mentor, $student);
        $this->createSession($otherMentor, $student);
        $this->createSession($mentor, $student, [
            'refund_status' => 'menunggu',
        ]);
        $this->createSession($mentor, $student, [
            'cancelled_by' => 'mentor',
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Mentor/Dashboard', false)
                ->has('studentCancelledSessions', 1)
                ->where('studentCancelledSessions.0.id', $ownSession->id)
                ->etc());
    }

    public function test_dashboard_excludes_student_cancelled_sessions_updated_more_than_seven_days_ago(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $recentSession = $this->createSession($mentor, $student);
        $oldSession = $this->createSession($mentor, $student);

        MentoringSession::query()->whereKey($oldSession->id)->update([
            'updated_at' => now()->subDays(8),
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Mentor/Dashboard', false)
                ->has('studentCancelledSessions', 1)
                ->where('studentCancelledSessions.0.id', $recentSession->id)
                ->etc());
    }

    public function test_dashboard_sorts_student_cancelled_sessions_by_updated_at_descending_and_limits_to_twenty(): void
    {
        $this->travelTo('2026-10-24 12:00:00');
        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $sessions = [];

        for ($index = 0; $index < 22; $index++) {
            $sessions[$index] = $this->createSession($mentor, $student);
            MentoringSession::query()->whereKey($sessions[$index]->id)->update([
                'updated_at' => now()->subMinutes(22 - $index),
            ]);
        }

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Mentor/Dashboard', false)
                ->has('studentCancelledSessions', 20)
                ->where('studentCancelledSessions.0.id', $sessions[21]->id)
                ->where('studentCancelledSessions.19.id', $sessions[2]->id)
                ->etc());
    }

    public function test_dashboard_student_cancelled_session_only_exposes_requested_session_fields_and_student_name(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create([
            'name' => 'Budi Mentee',
            'email' => 'budi@example.test',
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Budi Mentee',
        ]);
        $session = $this->createSession($mentor, $student, [
            'cancellation_reason' => 'Alasan pembatalan.',
            'is_free_session' => false,
            'payment_dp_proof' => 'payment-proofs/dp.jpg',
            'refund_proof' => 'refund-proofs/receipt.pdf',
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Mentor/Dashboard', false)
                ->has('studentCancelledSessions', 1)
                ->where('studentCancelledSessions.0.id', $session->id)
                ->where(
                    'studentCancelledSessions.0.schedule_time',
                    $session->schedule_time->copy()->setTimezone('UTC')->toISOString(),
                )
                ->where(
                    'studentCancelledSessions.0.end_time',
                    $session->end_time->copy()->setTimezone('UTC')->toISOString(),
                )
                ->where('studentCancelledSessions.0.cancellation_reason', 'Alasan pembatalan.')
                ->where('studentCancelledSessions.0.is_free_session', false)
                ->where('studentCancelledSessions.0.student', [
                    'id' => $student->id,
                    'name' => 'Budi Mentee',
                ])
                ->missing('studentCancelledSessions.0.student_id')
                ->missing('studentCancelledSessions.0.student.email')
                ->missing('studentCancelledSessions.0.student.bank_name')
                ->missing('studentCancelledSessions.0.student.bank_account_number')
                ->missing('studentCancelledSessions.0.student.bank_account_holder')
                ->missing('studentCancelledSessions.0.payment_dp_proof')
                ->missing('studentCancelledSessions.0.refund_proof')
                ->missing('studentCancelledSessions.0.refund_status')
                ->missing('studentCancelledSessions.0.updated_at')
                ->etc());
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Backend Development',
        ]);

        return $mentor;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createSession(
        User $mentor,
        User $student,
        array $overrides = [],
    ): MentoringSession {
        $scheduleTime = now()->addDays(2)->setTime(14, 0);

        return MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'terverifikasi',
            'payment_dp_proof' => 'payment-proofs/sample.png',
            'cancelled_by' => 'mentee',
            'cancellation_reason' => 'Dibatalkan oleh student.',
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ], $overrides));
    }
}

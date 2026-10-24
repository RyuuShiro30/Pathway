<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class NoShowReportVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_report_when_session_is_inside_report_window(): void
    {
        $this->travelTo('2026-10-20 10:20:00');

        [$student] = $this->createSession();

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('bookings.0.can_report_no_show', true)
                ->where('bookings.0.no_show_report', null));
    }

    public function test_cannot_report_before_15_minutes_after_start(): void
    {
        $this->travelTo('2026-10-20 10:14:00');

        [$student] = $this->createSession();

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('bookings.0.can_report_no_show', false));
    }

    public function test_cannot_report_after_24_hours_from_session_end(): void
    {
        $this->travelTo('2026-10-21 11:01:00');

        [$student] = $this->createSession();

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('bookings.0.can_report_no_show', false));
    }

    public function test_cannot_report_ongoing_session(): void
    {
        $this->travelTo('2026-10-20 10:20:00');

        [$student] = $this->createSession('berlangsung');

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('bookings.0.can_report_no_show', false));
    }

    public function test_reporter_sees_report_status_but_cannot_respond(): void
    {
        $this->travelTo('2026-10-20 10:20:00');

        [$student, , $session] = $this->createSession();
        $this->createReport($session, $student->id, $session->mentor_id);

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('bookings.0.can_report_no_show', false)
                ->where('bookings.0.no_show_report.status', 'menunggu_respons')
                ->where('bookings.0.no_show_report.is_reporter', true)
                ->where('bookings.0.no_show_report.can_respond', false)
                ->missing('bookings.0.no_show_report.evidence_path'));
    }

    public function test_reported_mentor_can_respond_on_tracking_page_without_leaking_paths(): void
    {
        $this->travelTo('2026-10-20 10:20:00');

        [$student, $mentor, $session] = $this->createSession();
        $this->createReport($session, $student->id, $mentor->id);

        $this->actingAs($mentor)
            ->get(route('mentor.session.tracking', $session->id))
            ->assertInertia(fn (Assert $page) => $page
                ->where('canReportNoShow', false)
                ->where('noShowReport.is_reporter', false)
                ->where('noShowReport.can_respond', true)
                ->where('noShowReport.reporter_note', 'Sudah menunggu 15 menit.')
                ->missing('noShowReport.evidence_path')
                ->missing('session.no_show_report'));
    }

    public function test_cannot_respond_after_deadline(): void
    {
        $this->travelTo('2026-10-20 10:20:00');

        [$student, $mentor, $session] = $this->createSession();
        $this->createReport($session, $student->id, $mentor->id, [
            'respond_deadline' => now()->subMinute(),
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.session.tracking', $session->id))
            ->assertInertia(fn (Assert $page) => $page
                ->where('noShowReport.can_respond', false));
    }

    public function test_mentor_can_report_on_tracking_page_inside_window(): void
    {
        $this->travelTo('2026-10-20 10:20:00');

        [, $mentor, $session] = $this->createSession();

        $this->actingAs($mentor)
            ->get(route('mentor.session.tracking', $session->id))
            ->assertInertia(fn (Assert $page) => $page
                ->where('canReportNoShow', true)
                ->where('noShowReport', null));
    }

    /**
     * @return array{0: User, 1: User, 2: MentoringSession}
     */
    private function createSession(string $status = 'dikonfirmasi'): array
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $scheduleTime = Carbon::parse('2026-10-20 10:00:00');

        $session = MentoringSession::query()->create([
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

        return [$student, $mentor, $session];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createReport(
        MentoringSession $session,
        int $reporterId,
        int $reportedUserId,
        array $overrides = [],
    ): NoShowReport {
        return NoShowReport::query()->create(array_merge([
            'session_id' => $session->id,
            'reporter_id' => $reporterId,
            'reported_user_id' => $reportedUserId,
            'status' => 'menunggu_respons',
            'reporter_note' => 'Sudah menunggu 15 menit.',
            'evidence_path' => 'no-show-reports/bukti.png',
            'respond_deadline' => now()->addHours(24),
        ], $overrides));
    }
}

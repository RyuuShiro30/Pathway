<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinalizeNoShowReportsTest extends TestCase
{
    use RefreshDatabase;

    public function test_unanswered_report_against_student_cancels_session_and_forfeits_dp(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [$session, $report] = $this->createReport('student', false);

        $this->artisan('no-show:finalize')->assertSuccessful();

        $session->refresh();
        $report->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentee', $session->cancelled_by);
        $this->assertSame('tidak_berlaku', $session->refund_status);
        $this->assertNull($session->refund_deadline);
        $this->assertSame('terverifikasi', $session->payment_dp_status);
        $this->assertSame('payment-proofs/test_dp.jpg', $session->payment_dp_proof);
        $this->assertSame('berlaku', $report->status);
        $this->assertNotNull($report->finalized_at);
    }

    public function test_unanswered_report_against_mentor_cancels_paid_session_with_refund_waiting(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [$session, $report] = $this->createReport('mentor', false);

        $this->artisan('no-show:finalize')->assertSuccessful();

        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentor', $session->cancelled_by);
        $this->assertSame('menunggu', $session->refund_status);
        $this->assertTrue($session->refund_deadline->equalTo(now()->addHours(48)));
        $this->assertSame('berlaku', $report->refresh()->status);
    }

    public function test_unanswered_report_against_mentor_on_free_session_has_no_refund(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [$session] = $this->createReport('mentor', true);

        $this->artisan('no-show:finalize')->assertSuccessful();

        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentor', $session->cancelled_by);
        $this->assertSame('tidak_berlaku', $session->refund_status);
        $this->assertNull($session->refund_deadline);
    }

    public function test_report_before_deadline_is_left_alone(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [$session, $report] = $this->createReport('student', false, [
            'respond_deadline' => now()->addHour(),
        ]);

        $this->artisan('no-show:finalize')->assertSuccessful();

        $this->assertSame('dikonfirmasi', $session->refresh()->status);
        $this->assertSame('menunggu_respons', $report->refresh()->status);
    }

    public function test_disputed_report_is_left_alone(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [$session, $report] = $this->createReport('student', false, [
            'status' => 'disanggah',
        ]);

        $this->artisan('no-show:finalize')->assertSuccessful();

        $this->assertSame('dikonfirmasi', $session->refresh()->status);
        $this->assertSame('disanggah', $report->refresh()->status);
    }

    public function test_report_is_closed_without_sanction_when_session_already_changed(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [$session, $report] = $this->createReport('student', false, [], [
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
        ]);

        $this->artisan('no-show:finalize')->assertSuccessful();

        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentor', $session->cancelled_by);
        $this->assertSame('tidak_berlaku', $report->refresh()->status);
    }

    public function test_running_twice_does_not_change_refund_deadline(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [$session] = $this->createReport('mentor', false);

        $this->artisan('no-show:finalize')->assertSuccessful();

        $firstDeadline = $session->refresh()->refund_deadline->copy();

        $this->travelTo('2026-10-20 13:00:00');

        $this->artisan('no-show:finalize')->assertSuccessful();

        $this->assertTrue($session->refresh()->refund_deadline->equalTo($firstDeadline));
    }

    /**
     * @param  'student'|'mentor'  $reported
     * @param  array<string, mixed>  $reportOverrides
     * @param  array<string, mixed>  $sessionOverrides
     * @return array{0: MentoringSession, 1: NoShowReport}
     */
    private function createReport(
        string $reported,
        bool $isFree,
        array $reportOverrides = [],
        array $sessionOverrides = [],
    ): array {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $scheduleTime = now()->subHours(3);

        $session = MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => $isFree,
            'price_snapshot' => $isFree ? 0 : 100000,
            'payment_dp_status' => $isFree ? 'tidak_berlaku' : 'terverifikasi',
            'payment_dp_proof' => $isFree ? null : 'payment-proofs/test_dp.jpg',
            'refund_status' => 'tidak_berlaku',
        ], $sessionOverrides));

        $reportedUser = $reported === 'student' ? $student : $mentor;
        $reporter = $reported === 'student' ? $mentor : $student;

        $report = NoShowReport::query()->create(array_merge([
            'session_id' => $session->id,
            'reporter_id' => $reporter->id,
            'reported_user_id' => $reportedUser->id,
            'status' => 'menunggu_respons',
            'evidence_path' => 'no-show-reports/bukti.png',
            'respond_deadline' => now()->subMinute(),
        ], $reportOverrides));

        return [$session, $report];
    }
}

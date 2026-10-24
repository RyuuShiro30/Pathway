<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoShowReportGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_cannot_cancel_confirmed_session_while_report_is_active(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        foreach (['menunggu_respons', 'disanggah'] as $reportStatus) {
            [$student, , $session] = $this->createSessionWithReport($reportStatus);

            $this->actingAs($student)
                ->patch(route('student.bookings.cancel-confirmed', $session->id), [
                    'cancellation_reason' => 'Ingin batal',
                ])
                ->assertSessionHasErrors('cancellation_reason');

            $this->assertSame('dikonfirmasi', $session->refresh()->status, $reportStatus);
        }
    }

    public function test_mentor_cannot_cancel_session_while_report_is_active(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        foreach (['menunggu_respons', 'disanggah'] as $reportStatus) {
            [, $mentor, $session] = $this->createSessionWithReport($reportStatus);

            $this->actingAs($mentor)
                ->patch(route('mentor.session.cancel', $session->id), [
                    'cancellation_reason' => 'Ingin batal',
                ])
                ->assertSessionHasErrors('cancellation_reason');

            $this->assertSame('dikonfirmasi', $session->refresh()->status, $reportStatus);
        }
    }

    public function test_mentor_cannot_start_session_while_report_is_active(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        foreach (['menunggu_respons', 'disanggah'] as $reportStatus) {
            [, $mentor, $session] = $this->createSessionWithReport($reportStatus);

            $this->actingAs($mentor)
                ->patch(route('mentor.session.start', $session->id))
                ->assertSessionHasErrors('message');

            $this->assertSame('dikonfirmasi', $session->refresh()->status, $reportStatus);
        }
    }

    public function test_closed_report_does_not_block_cancellation(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        [$student, , $session] = $this->createSessionWithReport('tidak_berlaku');

        $this->actingAs($student)
            ->patch(route('student.bookings.cancel-confirmed', $session->id), [
                'cancellation_reason' => 'Ingin batal',
            ])
            ->assertSessionHas('success');

        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentee', $session->cancelled_by);
    }

    /**
     * @return array{0: User, 1: User, 2: MentoringSession}
     */
    private function createSessionWithReport(string $reportStatus): array
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $scheduleTime = now()->addDay();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        NoShowReport::query()->create([
            'session_id' => $session->id,
            'reporter_id' => $mentor->id,
            'reported_user_id' => $student->id,
            'status' => $reportStatus,
            'evidence_path' => 'no-show-reports/bukti.png',
            'respond_deadline' => now()->addHours(24),
        ]);

        return [$student, $mentor, $session];
    }
}

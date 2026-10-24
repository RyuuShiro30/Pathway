<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MentorDashboardNoShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_sends_active_no_show_report_without_evidence_path(): void
    {
        $this->travelTo('2026-10-20 10:20:00');

        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $scheduleTime = Carbon::parse('2026-10-20 10:00:00');

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
            'reporter_id' => $student->id,
            'reported_user_id' => $mentor->id,
            'status' => 'menunggu_respons',
            'reporter_note' => 'Sudah menunggu 15 menit.',
            'evidence_path' => 'no-show-reports/bukti.png',
            'respond_deadline' => now()->addHours(24),
        ]);

        $this->actingAs($mentor)
            ->get('/mentor/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('confirmedSessions.0.no_show_report.status', 'menunggu_respons')
                ->where('confirmedSessions.0.no_show_report.can_respond', true)
                ->missing('confirmedSessions.0.no_show_report.evidence_path'));
    }
}

<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NoShowReportEvidenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_reporter_can_view_report_evidence(): void
    {
        [$reporter, , $report] = $this->createReport();

        $response = $this->actingAs($reporter)
            ->get(route('no-show.evidence', [$report->id, 'report']))
            ->assertOk();

        $this->assertSame('isi-bukti-pelapor', $response->streamedContent());
    }

    public function test_reported_user_can_view_report_evidence(): void
    {
        [, $reported, $report] = $this->createReport();

        $this->actingAs($reported)
            ->get(route('no-show.evidence', [$report->id, 'report']))
            ->assertOk();
    }

    public function test_both_parties_can_view_response_evidence(): void
    {
        [$reporter, $reported, $report] = $this->createReport([
            'response_evidence_path' => 'no-show-responses/sanggah.png',
        ]);

        Storage::disk('local')->put('no-show-responses/sanggah.png', 'isi-bukti-sanggahan');

        $response = $this->actingAs($reported)
            ->get(route('no-show.evidence', [$report->id, 'response']))
            ->assertOk();

        $this->assertSame('isi-bukti-sanggahan', $response->streamedContent());

        $this->actingAs($reporter)
            ->get(route('no-show.evidence', [$report->id, 'response']))
            ->assertOk();
    }

    public function test_outsider_gets_not_found(): void
    {
        [, , $report] = $this->createReport();
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->get(route('no-show.evidence', [$report->id, 'report']))
            ->assertNotFound();
    }

    public function test_response_evidence_is_not_found_when_none_was_uploaded(): void
    {
        [$reporter, , $report] = $this->createReport();

        $this->actingAs($reporter)
            ->get(route('no-show.evidence', [$report->id, 'response']))
            ->assertNotFound();
    }

    public function test_missing_file_on_disk_is_not_found(): void
    {
        [$reporter, , $report] = $this->createReport([
            'evidence_path' => 'no-show-reports/hilang.png',
        ]);

        $this->actingAs($reporter)
            ->get(route('no-show.evidence', [$report->id, 'report']))
            ->assertNotFound();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get(route('no-show.evidence', [1, 'report']))
            ->assertRedirect(route('login'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array{0: User, 1: User, 2: NoShowReport}
     */
    private function createReport(array $overrides = []): array
    {
        Storage::fake('local');
        Storage::disk('local')->put('no-show-reports/bukti.png', 'isi-bukti-pelapor');

        $reporter = User::factory()->create();
        $reported = User::factory()->create();
        $scheduleTime = now()->subHours(2);

        $session = MentoringSession::query()->create([
            'student_id' => $reporter->id,
            'mentor_id' => $reported->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        $report = NoShowReport::query()->create(array_merge([
            'session_id' => $session->id,
            'reporter_id' => $reporter->id,
            'reported_user_id' => $reported->id,
            'status' => 'menunggu_respons',
            'evidence_path' => 'no-show-reports/bukti.png',
            'respond_deadline' => now()->addHours(24),
        ], $overrides));

        return [$reporter, $reported, $report];
    }
}

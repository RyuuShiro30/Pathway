<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NoShowReportRespondTest extends TestCase
{
    use RefreshDatabase;

    public function test_reported_user_can_dispute_with_note_only(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [, $reported, $report] = $this->createReport();

        $this->actingAs($reported)
            ->patch(route('no-show.respond', $report->id), [
                'response_note' => 'Saya sudah menunggu di Discord.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $report->refresh();

        $this->assertSame('disanggah', $report->status);
        $this->assertSame('Saya sudah menunggu di Discord.', $report->response_note);
        $this->assertNull($report->response_evidence_path);
        $this->assertNotNull($report->responded_at);
    }

    public function test_dispute_can_include_a_private_screenshot(): void
    {
        Storage::fake('local');
        $this->travelTo('2026-10-20 12:00:00');

        [, $reported, $report] = $this->createReport();

        $this->actingAs($reported)
            ->patch(route('no-show.respond', $report->id), [
                'response_note' => 'Ini buktinya.',
                'response_evidence' => UploadedFile::fake()->image('sanggah.png'),
            ])
            ->assertSessionHas('success');

        $report->refresh();

        $this->assertNotNull($report->response_evidence_path);
        Storage::disk('local')->assertExists($report->response_evidence_path);
    }

    public function test_dispute_requires_a_note(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [, $reported, $report] = $this->createReport();

        $this->actingAs($reported)
            ->patch(route('no-show.respond', $report->id), [])
            ->assertSessionHasErrors('response_note');

        $this->assertSame('menunggu_respons', $report->refresh()->status);
    }

    public function test_reporter_cannot_respond_to_own_report(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [$reporter, , $report] = $this->createReport();

        $this->actingAs($reporter)
            ->patch(route('no-show.respond', $report->id), ['response_note' => 'Coba sanggah sendiri'])
            ->assertNotFound();

        $this->assertSame('menunggu_respons', $report->refresh()->status);
    }

    public function test_outsider_gets_not_found(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [, , $report] = $this->createReport();
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->patch(route('no-show.respond', $report->id), ['response_note' => 'Bukan urusanku'])
            ->assertNotFound();

        $this->assertSame('menunggu_respons', $report->refresh()->status);
    }

    public function test_dispute_after_deadline_is_rejected(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [, $reported, $report] = $this->createReport([
            'respond_deadline' => now()->subMinute(),
        ]);

        $this->actingAs($reported)
            ->patch(route('no-show.respond', $report->id), ['response_note' => 'Telat'])
            ->assertSessionHasErrors('message');

        $this->assertSame('menunggu_respons', $report->refresh()->status);
    }

    public function test_already_disputed_report_cannot_be_disputed_again(): void
    {
        $this->travelTo('2026-10-20 12:00:00');

        [, $reported, $report] = $this->createReport([
            'status' => 'disanggah',
            'response_note' => 'Sanggahan pertama',
        ]);

        $this->actingAs($reported)
            ->patch(route('no-show.respond', $report->id), ['response_note' => 'Sanggahan kedua'])
            ->assertSessionHasErrors('message');

        $this->assertSame('Sanggahan pertama', $report->refresh()->response_note);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->patch(route('no-show.respond', 1), ['response_note' => 'Tamu'])
            ->assertRedirect(route('login'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array{0: User, 1: User, 2: NoShowReport}
     */
    private function createReport(array $overrides = []): array
    {
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

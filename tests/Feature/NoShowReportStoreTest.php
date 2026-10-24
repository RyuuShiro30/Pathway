<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NoShowReportStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_report_mentor_no_show_after_grace_period(): void
    {
        Storage::fake('local');

        [$student, $mentor, $session] = $this->createConfirmedSession();

        $this->travelTo('2026-10-20 10:16:00');

        $this->actingAs($student)
            ->post(route('no-show.store', $session->id), $this->payload())
            ->assertRedirect()
            ->assertSessionHas('success');

        $report = NoShowReport::query()->where('session_id', $session->id)->firstOrFail();

        $this->assertSame($student->id, $report->reporter_id);
        $this->assertSame($mentor->id, $report->reported_user_id);
        $this->assertSame('menunggu_respons', $report->status);
        $this->assertSame('Sudah menunggu 15 menit.', $report->reporter_note);
        $this->assertTrue($report->respond_deadline->equalTo(now()->addHours(24)));
        Storage::disk('local')->assertExists($report->evidence_path);
        $this->assertSame('dikonfirmasi', $session->refresh()->status);
    }

    public function test_mentor_can_report_student_no_show(): void
    {
        Storage::fake('local');

        [$student, $mentor, $session] = $this->createConfirmedSession();

        $this->travelTo('2026-10-20 10:30:00');

        $this->actingAs($mentor)
            ->post(route('no-show.store', $session->id), $this->payload())
            ->assertRedirect()
            ->assertSessionHas('success');

        $report = NoShowReport::query()->where('session_id', $session->id)->firstOrFail();

        $this->assertSame($mentor->id, $report->reporter_id);
        $this->assertSame($student->id, $report->reported_user_id);
    }

    public function test_report_is_rejected_before_15_minutes_after_start(): void
    {
        Storage::fake('local');

        [$student, , $session] = $this->createConfirmedSession();

        $this->travelTo('2026-10-20 10:14:00');

        $this->actingAs($student)
            ->post(route('no-show.store', $session->id), $this->payload())
            ->assertSessionHasErrors('message');

        $this->assertDatabaseCount('no_show_reports', 0);
    }

    public function test_report_is_rejected_more_than_24_hours_after_session_ends(): void
    {
        Storage::fake('local');

        [$student, , $session] = $this->createConfirmedSession();

        $this->travelTo('2026-10-21 11:01:00');

        $this->actingAs($student)
            ->post(route('no-show.store', $session->id), $this->payload())
            ->assertSessionHasErrors('message');

        $this->assertDatabaseCount('no_show_reports', 0);
    }

    public function test_report_requires_evidence_screenshot(): void
    {
        Storage::fake('local');

        [$student, , $session] = $this->createConfirmedSession();

        $this->travelTo('2026-10-20 10:16:00');

        $this->actingAs($student)
            ->post(route('no-show.store', $session->id), ['reporter_note' => 'Tanpa bukti'])
            ->assertSessionHasErrors('evidence');

        $this->assertDatabaseCount('no_show_reports', 0);
    }

    public function test_ongoing_session_cannot_be_reported(): void
    {
        Storage::fake('local');

        [$student, , $session] = $this->createConfirmedSession(['status' => 'berlangsung']);

        $this->travelTo('2026-10-20 10:16:00');

        $this->actingAs($student)
            ->post(route('no-show.store', $session->id), $this->payload())
            ->assertSessionHasErrors('message');

        $this->assertDatabaseCount('no_show_reports', 0);
    }

    public function test_user_outside_the_session_gets_not_found(): void
    {
        Storage::fake('local');

        [, , $session] = $this->createConfirmedSession();
        $outsider = User::factory()->create();

        $this->travelTo('2026-10-20 10:16:00');

        $this->actingAs($outsider)
            ->post(route('no-show.store', $session->id), $this->payload())
            ->assertNotFound();

        $this->assertDatabaseCount('no_show_reports', 0);
    }

    public function test_second_report_for_same_session_is_rejected(): void
    {
        Storage::fake('local');

        [$student, $mentor, $session] = $this->createConfirmedSession();

        $this->travelTo('2026-10-20 10:16:00');

        $this->actingAs($student)
            ->post(route('no-show.store', $session->id), $this->payload())
            ->assertSessionHas('success');

        $this->actingAs($mentor)
            ->post(route('no-show.store', $session->id), $this->payload())
            ->assertSessionHasErrors('message');

        $this->assertDatabaseCount('no_show_reports', 1);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->post(route('no-show.store', 1))
            ->assertRedirect(route('login'));
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        return [
            'evidence' => UploadedFile::fake()->image('bukti.png'),
            'reporter_note' => 'Sudah menunggu 15 menit.',
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array{0: User, 1: User, 2: MentoringSession}
     */
    private function createConfirmedSession(array $overrides = []): array
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $scheduleTime = Carbon::parse('2026-10-20 10:00:00');

        $session = MentoringSession::query()->create(array_merge([
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
        ], $overrides));

        return [$student, $mentor, $session];
    }
}

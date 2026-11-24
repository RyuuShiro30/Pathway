<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use App\Models\UnresolvedSessionCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DetectUnresolvedSessionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_a_case_for_an_unresolved_session(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->mentor()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => Carbon::parse('2026-11-20 10:00:00'),
            'end_time' => Carbon::parse('2026-11-20 11:00:00'),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        $this->travelTo(Carbon::parse('2026-11-22 12:00:00'));

        $this->artisan('app:detect-unresolved-sessions')
            ->assertSuccessful();

        $this->assertDatabaseHas('unresolved_session_cases', [
            'mentoring_session_id' => $session->id,
            'status' => 'perlu_ditinjau',
            'decision' => null,
        ]);
    }

    public function test_it_does_not_create_a_case_before_24_hours(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->mentor()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => Carbon::parse('2026-11-20 10:00:00'),
            'end_time' => Carbon::parse('2026-11-20 11:00:00'),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        $this->travelTo(Carbon::parse('2026-11-21 10:00:00'));

        $this->artisan('app:detect-unresolved-sessions')
            ->assertSuccessful();

        $this->assertDatabaseMissing('unresolved_session_cases', [
            'mentoring_session_id' => $session->id,
        ]);
    }

    public function test_it_does_not_create_a_case_for_a_session_with_a_no_show_report(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->mentor()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => Carbon::parse('2026-11-20 10:00:00'),
            'end_time' => Carbon::parse('2026-11-20 11:00:00'),
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
            'status' => 'tidak_berlaku',
            'evidence_path' => 'no-show-reports/bukti.png',
            'respond_deadline' => Carbon::parse('2026-11-21 11:00:00'),
        ]);

        $this->travelTo(Carbon::parse('2026-11-22 12:00:00'));

        $this->artisan('app:detect-unresolved-sessions')
            ->assertSuccessful();

        $this->assertDatabaseMissing('unresolved_session_cases', [
            'mentoring_session_id' => $session->id,
        ]);
    }

    public function test_it_does_not_create_a_case_for_a_session_with_another_status(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->mentor()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'berlangsung',
            'schedule_time' => Carbon::parse('2026-11-20 10:00:00'),
            'end_time' => Carbon::parse('2026-11-20 11:00:00'),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        $this->travelTo(Carbon::parse('2026-11-22 12:00:00'));

        $this->artisan('app:detect-unresolved-sessions')
            ->assertSuccessful();

        $this->assertDatabaseMissing('unresolved_session_cases', [
            'mentoring_session_id' => $session->id,
        ]);
    }

    public function test_it_does_not_create_a_case_when_end_time_is_null(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->mentor()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => Carbon::parse('2026-11-20 10:00:00'),
            'end_time' => null,
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        $this->travelTo(Carbon::parse('2026-11-22 12:00:00'));

        $this->artisan('app:detect-unresolved-sessions')
            ->assertSuccessful();

        $this->assertDatabaseMissing('unresolved_session_cases', [
            'mentoring_session_id' => $session->id,
        ]);
    }

    public function test_it_does_not_create_duplicate_case_for_existing_case(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->mentor()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => Carbon::parse('2026-11-20 10:00:00'),
            'end_time' => Carbon::parse('2026-11-20 11:00:00'),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        UnresolvedSessionCase::query()->create([
            'mentoring_session_id' => $session->id,
            'status' => 'perlu_ditinjau',
        ]);

        $this->travelTo(Carbon::parse('2026-11-22 12:00:00'));

        $this->artisan('app:detect-unresolved-sessions')
            ->assertSuccessful();

        $this->assertDatabaseCount('unresolved_session_cases', 1);

        $this->assertDatabaseHas('unresolved_session_cases', [
            'mentoring_session_id' => $session->id,
            'status' => 'perlu_ditinjau',
        ]);
    }

    public function test_running_the_command_twice_does_not_create_duplicate_cases(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->mentor()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => Carbon::parse('2026-11-20 10:00:00'),
            'end_time' => Carbon::parse('2026-11-20 11:00:00'),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        $this->travelTo(Carbon::parse('2026-11-22 12:00:00'));

        // Pemeriksaan pertama
        $this->artisan('app:detect-unresolved-sessions')
            ->assertSuccessful();

        $this->assertDatabaseCount('unresolved_session_cases', 1);

        // Pemeriksaan kedua
        $this->artisan('app:detect-unresolved-sessions')
            ->assertSuccessful();

        // Kasus tetap satu
        $this->assertDatabaseCount('unresolved_session_cases', 1);

        $this->assertDatabaseHas('unresolved_session_cases', [
            'mentoring_session_id' => $session->id,
            'status' => 'perlu_ditinjau',
        ]);
    }
}
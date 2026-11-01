<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RescheduleTest extends TestCase
{
    use RefreshDatabase;

    // Sesi harus sudah dikonfirmasi
    public function test_student_can_only_request_reschedule_for_confirmed_session(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => '2026-11-05 09:00:00',
            'end_time' => '2026-11-05 10:00:00',
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
        ]);

        $response = $this->actingAs($student)
            ->post(
                route('student.bookings.reschedule.store', $session),
                [
                    'schedule_time' => '2026-11-06T09:00:00+07:00',
                    'duration_hours' => 1,
                ]
            );

        $response->assertSessionHasErrors([
            'session' => 'Hanya sesi yang sudah dikonfirmasi yang dapat di-reschedule.',
        ]);

        $this->assertDatabaseMissing('mentoring_reschedule_requests', [
            'session_id' => $session->id,
        ]);
    }

    // Reschedule harus dilakukan lebih dari 6 jam sebelum sesi
    public function test_student_cannot_request_reschedule_when_session_is_less_than_6_hours_away(): void
    {
        $this->travelTo('2026-11-05 01:00:00');

        $student = User::factory()->create();
        $mentor = User::factory()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => '2026-11-05 06:00:00',
            'end_time' => '2026-11-05 07:00:00',
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
        ]);

        $response = $this->actingAs($student)
            ->post(
                route('student.bookings.reschedule.store', $session),
                [
                    'schedule_time' => '2026-11-06T09:00:00+07:00',
                    'duration_hours' => 1,
                ]
            );

        $response->assertSessionHasErrors([
            'session' => 'Reschedule hanya dapat dilakukan lebih dari 6 jam sebelum sesi.',
        ]);

        $this->assertDatabaseMissing('mentoring_reschedule_requests', [
            'session_id' => $session->id,
        ]);
    }

    // Satu session hanya dapat di-reschedule satu kali
    public function test_student_cannot_reschedule_session_that_has_already_been_rescheduled(): void
    {
        $this->travelTo('2026-11-01 08:00:00');

        $student = User::factory()->create();
        $mentor = User::factory()->create();

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => '2026-11-05 09:00:00',
            'end_time' => '2026-11-05 10:00:00',
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
        ]);

        $session->rescheduleRequests()->create([
            'requested_by' => 'student',
            'request_type' => 'student_reschedule',
            'old_schedule_time' => '2026-11-05 09:00:00',
            'old_end_time' => '2026-11-05 10:00:00',
            'new_schedule_time' => '2026-11-06 09:00:00',
            'new_end_time' => '2026-11-06 10:00:00',
            'status' => 'diterima',
            'respond_deadline' => '2026-11-02 09:00:00',
            'responded_at' => '2026-11-01 10:00:00',
        ]);

        $response = $this->actingAs($student)
            ->post(
                route('student.bookings.reschedule.store', $session),
                [
                    'schedule_time' => '2026-11-07T09:00:00+07:00',
                    'duration_hours' => 1,
                ]
            );

        $response->assertSessionHasErrors([
            'session' => 'Sesi ini sudah pernah di-reschedule.',
        ]);

        $this->assertDatabaseCount('mentoring_reschedule_requests', 1);
    }
}
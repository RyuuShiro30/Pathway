<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RescheduleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Membuat mentor profile untuk kebutuhan test.
     */
    private function createMentorProfile(
        User $mentor,
        array $availabilitySchedule = []
    ): MentorProfile {
        return MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'bio' => 'Mentor test',
            'portfolio_url' => null,
            'discord_room_link' => 'https://discord.gg/test',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'avg_rating' => 5,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => $availabilitySchedule,
        ]);
    }

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
                    'schedule_time' => '2026-11-06T09:00:00',
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
                    'schedule_time' => '2026-11-06T09:00:00', 
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

    // Jadwal pengganti harus tersedia dalam 10 hari ke depan
    public function test_student_cannot_reschedule_to_schedule_beyond_10_days(): void
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

        $response = $this->actingAs($student)
            ->post(
                route('student.bookings.reschedule.store', $session),
                [
                    'schedule_time' => '2026-11-12T09:00:00+07:00',
                    'duration_hours' => 1,
                ]
            );

        $response->assertSessionHasErrors([
            'schedule_time' => 'Jadwal reschedule harus tersedia dalam 10 hari ke depan.',
        ]);

        $this->assertDatabaseMissing('mentoring_reschedule_requests', [
            'session_id' => $session->id,
        ]);
    }

    // Jadwal baru tidak boleh bentrok dengan session lain
    public function test_student_cannot_reschedule_to_a_busy_schedule(): void
    {
        $this->travelTo('2026-11-01 08:00:00');

        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $otherStudent = User::factory()->create();

        $this->createMentorProfile($mentor, [
            [
                'day' => 'jumat',
                'start' => '09:00',
                'end' => '17:00',
                'type' => 'gratis',
                'price' => null,
            ],
        ]);

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

        MentoringSession::query()->create([
            'student_id' => $otherStudent->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => '2026-11-06 09:00:00',
            'end_time' => '2026-11-06 10:00:00',
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
        ]);

        $response = $this->actingAs($student)
            ->post(
                route('student.bookings.reschedule.store', $session),
                [
                    'schedule_time' => '2026-11-06T09:00:00',
                    'duration_hours' => 1,
                ]
            );

        $response->assertSessionHasErrors([
            'schedule_time' => 'Jadwal tersebut tidak tersedia.',
        ]);

        $this->assertDatabaseCount('mentoring_reschedule_requests', 0);
    }

    // Durasi reschedule maksimal 2 jam
    public function test_student_cannot_reschedule_for_more_than_2_hours(): void
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

        $response = $this->actingAs($student)
            ->post(route('student.bookings.reschedule.store', $session), [
                'schedule_time' => '2026-11-06T09:00:00',
                'duration_hours' => 3,
            ]);

        $response->assertSessionHasErrors('duration_hours');

        $this->assertDatabaseMissing('mentoring_reschedule_requests', [
            'session_id' => $session->id,
        ]);
    }

    // Jadwal baru harus berada di masa mendatang
    public function test_student_cannot_reschedule_to_past_schedule(): void
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

        $response = $this->actingAs($student)
            ->post(route('student.bookings.reschedule.store', $session), [
                'schedule_time' => '2026-10-31T09:00:00+07:00',
                'duration_hours' => 1,
            ]);

        $response->assertSessionHasErrors([
            'schedule_time' => 'Jadwal reschedule harus berada di waktu mendatang.',
        ]);

        $this->assertDatabaseMissing('mentoring_reschedule_requests', [
            'session_id' => $session->id,
        ]);
    }

    // Request reschedule tersimpan dengan status menunggu respons
    public function test_student_reschedule_request_is_created_with_24_hour_deadline(): void
    {
        $this->travelTo('2026-11-01 08:00:00');

        $student = User::factory()->create();
        $mentor = User::factory()->create();

        $this->createMentorProfile($mentor, [
            [
                'day' => 'jumat',
                'start' => '09:00',
                'end' => '17:00',
                'type' => 'gratis',
                'price' => null,
            ],
        ]);

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

        $response = $this->actingAs($student)
            ->post(route('student.bookings.reschedule.store', $session), [
                'schedule_time' => '2026-11-06T09:00:00',
                'duration_hours' => 1,
            ]);

        $response->assertRedirect(route('student.bookings.index'));

        $this->assertDatabaseHas('mentoring_reschedule_requests', [
            'session_id' => $session->id,
            'requested_by' => 'student',
            'request_type' => 'student_reschedule',
            'status' => 'menunggu_respons',
            'new_schedule_time' => '2026-11-06 09:00:00',
            'new_end_time' => '2026-11-06 10:00:00',
        ]);

        $rescheduleRequest = $session->rescheduleRequests()->first();

        $this->assertNotNull($rescheduleRequest);
        $this->assertEquals(
            '2026-11-02 08:00:00',
            $rescheduleRequest->respond_deadline->format('Y-m-d H:i:s')
        );
    }

    // Slot pengganti harus sesuai dengan availability mentor
    public function test_student_cannot_reschedule_to_unavailable_mentor_slot(): void
    {
        $this->travelTo('2026-11-01 08:00:00');

        $student = User::factory()->create();
        $mentor = User::factory()->create();

        $this->createMentorProfile($mentor, [
            [
                'day' => 'senin',
                'start' => '09:00',
                'end' => '10:00',
                'type' => 'gratis',
                'price' => null,
            ],
        ]);

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

        $response = $this->actingAs($student)
            ->post(route('student.bookings.reschedule.store', $session), [
                'schedule_time' => '2026-11-06T09:00:00',
                'duration_hours' => 1,
            ]);

        $response->assertSessionHasErrors([
            'schedule_time' => 'Jadwal tersebut tidak tersedia pada jadwal mentor.',
        ]);

        $this->assertDatabaseMissing('mentoring_reschedule_requests', [
            'session_id' => $session->id,
        ]);
    }

    // Sesi gratis tidak boleh berubah menjadi sesi berbayar
    public function test_student_cannot_change_free_session_to_paid_session(): void
    {
        $this->travelTo('2026-11-01 08:00:00');

        $student = User::factory()->create();
        $mentor = User::factory()->create();

        $this->createMentorProfile($mentor, [
            [
                'day' => 'senin',
                'start' => '09:00',
                'end' => '10:00',
                'type' => 'berbayar',
                'price' => 50000,
            ],
        ]);

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

        $response = $this->actingAs($student)
            ->post(route('student.bookings.reschedule.store', $session), [
                'schedule_time' => '2026-11-09T09:00:00+07:00',
                'duration_hours' => 1,
            ]);

        $response->assertSessionHasErrors([
            'schedule_time' => 'Tipe dan harga sesi pengganti harus sama dengan sesi awal.',
        ]);

        $this->assertDatabaseMissing('mentoring_reschedule_requests', [
            'session_id' => $session->id,
        ]);
    }

    // Sesi berbayar harus mempertahankan harga
    public function test_student_cannot_change_paid_session_to_different_price(): void
    {
        $this->travelTo('2026-11-01 08:00:00');

        $student = User::factory()->create();
        $mentor = User::factory()->create();

        $this->createMentorProfile($mentor, [
            [
                'day' => 'senin',
                'start' => '09:00',
                'end' => '10:00',
                'type' => 'berbayar',
                'price' => 75000,
            ],
        ]);

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => '2026-11-05 09:00:00',
            'end_time' => '2026-11-05 10:00:00',
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
        ]);

        $response = $this->actingAs($student)
            ->post(route('student.bookings.reschedule.store', $session), [
                'schedule_time' => '2026-11-09T09:00:00+07:00',
                'duration_hours' => 1,
            ]);

        $response->assertSessionHasErrors([
            'schedule_time' => 'Tipe dan harga sesi pengganti harus sama dengan sesi awal.',
        ]);

        $this->assertDatabaseMissing('mentoring_reschedule_requests', [
            'session_id' => $session->id,
        ]);
    }
}
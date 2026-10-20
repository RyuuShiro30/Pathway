<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MentorRespondBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_accepts_pending_paid_booking(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $session = $this->createBooking($student, $mentor, false);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.booking.respond', $session->id),
            ['action' => 'terima'],
        );

        $response->assertRedirect(route('mentor.dashboard'));
        $response->assertSessionHas('success', 'Booking berhasil dikonfirmasi');
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dikonfirmasi',
            'discord_link' => 'https://discord.gg/mentor-room',
            'payment_dp_status' => 'terverifikasi',
        ]);
    }

    public function test_mentor_accepts_pending_free_booking_without_dp_payment(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $session = $this->createBooking($student, $mentor, true);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.booking.respond', $session->id),
            ['action' => 'terima'],
        );

        $response->assertRedirect(route('mentor.dashboard'));
        $response->assertSessionHas('success', 'Booking berhasil dikonfirmasi');
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dikonfirmasi',
            'discord_link' => 'https://discord.gg/mentor-room',
            'payment_dp_status' => 'tidak_berlaku',
        ]);
    }

    public function test_mentor_cannot_accept_overdue_paid_booking_and_session_attributes_remain_unchanged(): void
    {
        $this->freezeTime();

        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $pastSchedule = now()->subDays(3)->setTime(9, 0);
        $session = $this->createBooking($student, $mentor, false, [
            'schedule_time' => $pastSchedule,
            'end_time' => $pastSchedule->copy()->addHour(),
            'discord_link' => 'https://discord.gg/existing-room',
        ]);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($mentor)
            ->from(route('mentor.requests'))
            ->patch(route('mentor.booking.respond', $session->id), [
                'action' => 'terima',
            ]);

        $response->assertRedirect(route('mentor.requests'));
        $response->assertSessionHasErrors([
            'message' => 'Jadwal sesi sudah lewat, pengajuan ini tidak dapat diterima.',
        ]);
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_mentor_cannot_accept_overdue_free_booking_and_session_attributes_remain_unchanged(): void
    {
        $this->freezeTime();

        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $pastSchedule = now()->subDays(3)->setTime(9, 0);
        $session = $this->createBooking($student, $mentor, true, [
            'schedule_time' => $pastSchedule,
            'end_time' => $pastSchedule->copy()->addHour(),
            'discord_link' => 'https://discord.gg/existing-room',
        ]);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($mentor)
            ->from(route('mentor.requests'))
            ->patch(route('mentor.booking.respond', $session->id), [
                'action' => 'terima',
            ]);

        $response->assertRedirect(route('mentor.requests'));
        $response->assertSessionHasErrors([
            'message' => 'Jadwal sesi sudah lewat, pengajuan ini tidak dapat diterima.',
        ]);
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_mentor_rejects_pending_booking(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $session = $this->createBooking($student, $mentor, false);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.booking.respond', $session->id),
            ['action' => 'tolak'],
        );

        $response->assertRedirect(route('mentor.dashboard'));
        $response->assertSessionHas('success', 'Permintaan berhasil ditolak');
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
        ]);
    }

    public function test_mentor_can_reject_overdue_pending_booking(): void
    {
        $this->freezeTime();

        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $pastSchedule = now()->subDays(3)->setTime(9, 0);
        $session = $this->createBooking($student, $mentor, false, [
            'schedule_time' => $pastSchedule,
            'end_time' => $pastSchedule->copy()->addHour(),
        ]);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.booking.respond', $session->id),
            ['action' => 'tolak'],
        );

        $response->assertRedirect(route('mentor.dashboard'));
        $response->assertSessionHas('success', 'Permintaan berhasil ditolak');
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
        ]);
    }

    public function test_mentor_cannot_accept_cancelled_booking_and_refund_data_is_unchanged(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $session = $this->createBooking($student, $mentor, false, [
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentee',
            'cancellation_reason' => 'Student membatalkan pengajuan.',
            'refund_status' => 'menunggu',
            'refund_deadline' => '2026-10-15 12:00:00',
        ]);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($mentor)
            ->from(route('mentor.requests'))
            ->patch(route('mentor.booking.respond', $session->id), [
                'action' => 'terima',
            ]);

        $response->assertRedirect(route('mentor.requests'));
        $response->assertSessionHasErrors([
            'message' => 'Sesi ini sudah tidak dalam status diajukan',
        ]);
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_another_mentor_cannot_respond_to_a_booking_they_do_not_own(): void
    {
        $owner = $this->createMentor();
        $anotherMentor = $this->createMentor();
        $student = User::factory()->create();
        $session = $this->createBooking($student, $owner, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($anotherMentor)->patch(
            route('mentor.booking.respond', $session->id),
            ['action' => 'terima'],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_mentor_cannot_respond_with_an_invalid_action(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();
        $session = $this->createBooking($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($mentor)
            ->from(route('mentor.booking.show', $session->id))
            ->patch(route('mentor.booking.respond', $session->id), [
                'action' => 'batalkan',
            ]);

        $response->assertRedirect(route('mentor.booking.show', $session->id));
        $response->assertSessionHasErrors('action');
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);

        return $mentor;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createBooking(
        User $student,
        User $mentor,
        bool $isFreeSession,
        array $overrides = [],
    ): MentoringSession {
        $scheduleTime = now()->addDays(3)->setTime(9, 0);

        return MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => $isFreeSession,
            'price_snapshot' => $isFreeSession ? 0 : 100000,
            'payment_dp_status' => 'belum_bayar',
            'payment_dp_proof' => null,
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ], $overrides))->refresh();
    }
}

<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentCancelBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_cancels_paid_booking_and_preserves_payment_details(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false, [
            'payment_dp_status' => 'menunggu',
            'payment_dp_proof' => 'payment-proofs/original.png',
        ]);
        $this->travelTo('2026-10-13 22:00:00');

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel', $session->id),
            [
                'cancellation_reason' => '  Saya tidak dapat hadir.  ',
                'status' => 'selesai',
                'cancelled_by' => 'mentor',
                'refund_status' => 'selesai',
                'payment_dp_status' => 'diubah',
                'payment_dp_proof' => 'payment-proofs/fake.png',
            ],
        );

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHas('success', 'Pengajuan berhasil dibatalkan.');
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentee',
            'cancellation_reason' => 'Saya tidak dapat hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => '2026-10-15 22:00:00',
            'payment_dp_status' => 'menunggu',
            'payment_dp_proof' => 'payment-proofs/original.png',
        ]);
    }

    public function test_student_cancels_free_booking_without_changing_refund_fields(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, true);

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel', $session->id),
            ['cancellation_reason' => 'Tidak jadi mengikuti sesi.'],
        );

        $response->assertRedirect(route('student.bookings.index'));
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentee',
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ]);
    }

    public function test_student_cannot_cancel_booking_with_an_empty_reason(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)
            ->from(route('student.bookings.index'))
            ->patch(route('student.bookings.cancel', $session->id), [
                'cancellation_reason' => '',
            ]);

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasErrors('cancellation_reason');
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_student_cannot_cancel_booking_with_a_whitespace_only_reason(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)
            ->from(route('student.bookings.index'))
            ->patch(route('student.bookings.cancel', $session->id), [
                'cancellation_reason' => '   ',
            ]);

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasErrors('cancellation_reason');
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_student_cannot_cancel_booking_with_a_501_character_reason(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)
            ->from(route('student.bookings.index'))
            ->patch(route('student.bookings.cancel', $session->id), [
                'cancellation_reason' => str_repeat('a', 501),
            ]);

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasErrors('cancellation_reason');
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_student_cannot_cancel_booking_with_a_non_string_reason(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)
            ->from(route('student.bookings.index'))
            ->patch(route('student.bookings.cancel', $session->id), [
                'cancellation_reason' => ['Alasan'],
            ]);

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasErrors('cancellation_reason');
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_student_can_cancel_booking_with_a_trimmed_500_character_reason(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $reason = str_repeat('a', 500);

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel', $session->id),
            ['cancellation_reason' => " {$reason} "],
        );

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancellation_reason' => $reason,
        ]);
    }

    public function test_student_cannot_cancel_another_students_booking(): void
    {
        $owner = User::factory()->create();
        $anotherStudent = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($owner, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($anotherStudent)->patch(
            route('student.bookings.cancel', $session->id),
            ['cancellation_reason' => 'Alasan dari student lain.'],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_student_cannot_cancel_a_booking_that_does_not_exist(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel', $session->id + 1000),
            ['cancellation_reason' => 'Tidak jadi mengikuti sesi.'],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_student_cannot_cancel_a_confirmed_booking(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false, [
            'status' => 'dikonfirmasi',
        ]);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel', $session->id),
            ['cancellation_reason' => 'Tidak jadi mengikuti sesi.'],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_student_cannot_cancel_an_already_cancelled_booking_again(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false, [
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentee',
            'cancellation_reason' => 'Alasan sebelumnya.',
        ]);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel', $session->id),
            ['cancellation_reason' => 'Alasan baru.'],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_mentor_cannot_cancel_a_students_booking(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($mentor)->patch(
            route('student.bookings.cancel', $session->id),
            ['cancellation_reason' => 'Alasan dari mentor.'],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_guest_is_redirected_to_login_when_cancelling_booking(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->patch(route('student.bookings.cancel', $session->id), [
            'cancellation_reason' => 'Alasan dari tamu.',
        ]);

        $response->assertRedirect(route('login'));
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_session_mentor_can_open_refund_form_only_for_their_cancelled_paid_booking(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $anotherStudent = User::factory()->create();
        $anotherMentor = User::factory()->create();
        $anotherSession = $this->createSession($anotherStudent, $anotherMentor, false, [
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentee',
            'cancellation_reason' => 'Pengajuan dibatalkan.',
            'refund_status' => 'menunggu',
        ]);

        $cancelResponse = $this->actingAs($student)->patch(
            route('student.bookings.cancel', $session->id),
            ['cancellation_reason' => 'Tidak jadi mengikuti sesi.'],
        );

        $cancelResponse->assertRedirect(route('student.bookings.index'));

        $this->actingAs($mentor)
            ->get(route('mentor.refund.form', $session->id))
            ->assertOk();

        $this->get(route('mentor.refund.form', $anotherSession->id))
            ->assertNotFound();
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createSession(
        User $student,
        User $mentor,
        bool $isFreeSession,
        array $overrides = [],
    ): MentoringSession {
        return MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => '2026-10-20 09:00:00',
            'end_time' => '2026-10-20 10:00:00',
            'duration_hours' => 1,
            'is_free_session' => $isFreeSession,
            'price_snapshot' => $isFreeSession ? 0 : 100000,
            'payment_dp_status' => 'belum_bayar',
            'payment_dp_proof' => null,
        ], $overrides))->refresh();
    }
}

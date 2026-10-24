<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class StudentCancelConfirmedBookingTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_cancels_a_paid_confirmed_session_after_acknowledging_dp_forfeiture(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false, [
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
            'payment_dp_status' => 'terverifikasi',
            'payment_dp_proof' => 'payment-proofs/original.png',
            'discord_link' => 'https://discord.gg/original-room',
        ]);
        $this->travelTo('2026-10-24 12:00:00');

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel-confirmed', $session->id),
            [
                'cancellation_reason' => '  Saya tidak dapat hadir.  ',
                'acknowledge_dp_forfeit' => true,
                'status' => 'selesai',
                'cancelled_by' => 'mentor',
                'refund_status' => 'menunggu',
                'payment_dp_status' => 'diubah',
            ],
        );

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHas('success', 'Sesi berhasil dibatalkan.');
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentee',
            'cancellation_reason' => 'Saya tidak dapat hadir.',
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
            'payment_dp_status' => 'terverifikasi',
            'payment_dp_proof' => 'payment-proofs/original.png',
            'discord_link' => 'https://discord.gg/original-room',
        ]);
    }

    public function test_student_can_cancel_a_free_confirmed_session_without_dp_acknowledgement(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, true);

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel-confirmed', $session->id),
            ['cancellation_reason' => 'Tidak jadi mengikuti sesi.'],
        );

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHas('success', 'Sesi berhasil dibatalkan.');
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentee',
            'refund_status' => 'tidak_berlaku',
        ]);
    }

    #[DataProvider('invalidDpAcknowledgements')]
    public function test_paid_confirmed_session_requires_dp_forfeiture_acknowledgement(mixed $acknowledgement): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();
        $payload = ['cancellation_reason' => 'Saya tidak dapat hadir.'];

        if ($acknowledgement !== 'missing') {
            $payload['acknowledge_dp_forfeit'] = $acknowledgement;
        }

        $response = $this->actingAs($student)
            ->from(route('student.bookings.index'))
            ->patch(route('student.bookings.cancel-confirmed', $session->id), $payload);

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasErrors([
            'acknowledge_dp_forfeit' => 'Anda harus menyetujui bahwa DP tidak dikembalikan.',
        ]);
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public static function invalidDpAcknowledgements(): array
    {
        return [
            'missing' => ['missing'],
            'empty' => [''],
            'false string' => ['false'],
            'zero string' => ['0'],
            'false boolean' => [false],
            'zero integer' => [0],
        ];
    }

    public function test_student_can_acknowledge_dp_forfeiture_with_the_accepted_value(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel-confirmed', $session->id),
            [
                'cancellation_reason' => 'Tidak dapat hadir.',
                'acknowledge_dp_forfeit' => 'accepted',
            ],
        );

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'refund_status' => 'tidak_berlaku',
        ]);
    }

    #[DataProvider('invalidReasons')]
    public function test_student_cannot_cancel_a_confirmed_session_with_an_invalid_reason(mixed $reason): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)
            ->from(route('student.bookings.index'))
            ->patch(route('student.bookings.cancel-confirmed', $session->id), [
                'cancellation_reason' => $reason,
                'acknowledge_dp_forfeit' => true,
            ]);

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasErrors('cancellation_reason');
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public static function invalidReasons(): array
    {
        return [
            'empty' => [''],
            'whitespace only' => ['   '],
            '501 characters' => [str_repeat('a', 501)],
            'non-string' => [['Alasan']],
        ];
    }

    public function test_student_can_cancel_a_confirmed_session_with_a_trimmed_500_character_reason(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $reason = str_repeat('a', 500);

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel-confirmed', $session->id),
            [
                'cancellation_reason' => " {$reason} ",
                'acknowledge_dp_forfeit' => true,
            ],
        );

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancellation_reason' => $reason,
        ]);
    }

    public function test_another_student_receives_not_found_without_changing_the_session(): void
    {
        $owner = User::factory()->create();
        $anotherStudent = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($owner, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($anotherStudent)->patch(
            route('student.bookings.cancel-confirmed', $session->id),
            [
                'cancellation_reason' => 'Alasan dari student lain.',
                'acknowledge_dp_forfeit' => true,
            ],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_mentor_receives_not_found_without_changing_the_session(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($mentor)->patch(
            route('student.bookings.cancel-confirmed', $session->id),
            [
                'cancellation_reason' => 'Alasan dari mentor.',
                'acknowledge_dp_forfeit' => true,
            ],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_guest_is_redirected_to_login_without_changing_the_session(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->patch(route('student.bookings.cancel-confirmed', $session->id), [
            'cancellation_reason' => 'Alasan dari tamu.',
            'acknowledge_dp_forfeit' => true,
        ]);

        $response->assertRedirect(route('login'));
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_student_receives_not_found_for_a_missing_session(): void
    {
        $student = User::factory()->create();

        $this->actingAs($student)->patch(
            route('student.bookings.cancel-confirmed', 999999),
            [
                'cancellation_reason' => 'Alasan pembatalan.',
                'acknowledge_dp_forfeit' => true,
            ],
        )->assertNotFound();
    }

    #[DataProvider('nonConfirmedStatuses')]
    public function test_student_receives_not_found_for_a_session_with_an_ineligible_status(string $status): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false, [
            'status' => $status,
        ]);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel-confirmed', $session->id),
            [
                'cancellation_reason' => 'Alasan pembatalan.',
                'acknowledge_dp_forfeit' => true,
            ],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public static function nonConfirmedStatuses(): array
    {
        return [
            'diajukan' => ['diajukan'],
            'berlangsung' => ['berlangsung'],
            'selesai' => ['selesai'],
            'dibatalkan' => ['dibatalkan'],
        ];
    }

    public function test_student_receives_not_found_for_a_confirmed_session_that_has_started(): void
    {
        $this->travelTo('2026-10-24 12:00:00');
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createSession($student, $mentor, false, [
            'schedule_time' => now()->subMinute(),
            'end_time' => now()->addHour(),
        ]);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)->patch(
            route('student.bookings.cancel-confirmed', $session->id),
            [
                'cancellation_reason' => 'Alasan pembatalan.',
                'acknowledge_dp_forfeit' => true,
            ],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
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
        $scheduleTime = now()->addDays(2)->setTime(9, 0);

        return MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => $isFreeSession,
            'price_snapshot' => $isFreeSession ? 0 : 100000,
            'payment_dp_status' => $isFreeSession ? 'tidak_berlaku' : 'terverifikasi',
            'payment_dp_proof' => $isFreeSession ? null : 'payment-proofs/original.png',
            'discord_link' => 'https://discord.gg/original-room',
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ], $overrides))->refresh();
    }
}

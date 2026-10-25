<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentConfirmRefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_confirms_refund_with_sudah_terima_and_sets_status_to_selesai(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createRefundSession($student, $mentor);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)->patch(
            route('student.bookings.refund.confirm', $session->id),
            [
                'decision' => 'sudah_terima',
                'status' => 'berlangsung',
                'cancelled_by' => 'mentee',
                'refund_proof' => 'refund-proofs/hacked.png',
                'payment_dp_status' => 'diubah',
            ],
        );

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHas('success', 'Terima kasih, refund Anda sudah dikonfirmasi.');

        $expectedAttributes = array_merge($originalAttributes, [
            'refund_status' => 'selesai',
            'updated_at' => $session->fresh()->getRawOriginal('updated_at'),
        ]);

        $this->assertSame($expectedAttributes, $session->fresh()->getRawOriginal());
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'refund_status' => 'selesai',
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
            'refund_proof' => 'refund-proofs/sample.pdf',
            'payment_dp_status' => 'menunggu_verifikasi',
        ]);
    }

    public function test_student_confirms_refund_with_belum_terima_and_sets_status_to_dilaporkan(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createRefundSession($student, $mentor);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($student)->patch(
            route('student.bookings.refund.confirm', $session->id),
            [
                'decision' => 'belum_terima',
                'status' => 'berlangsung',
                'cancelled_by' => 'mentee',
                'refund_proof' => 'refund-proofs/hacked.png',
                'payment_dp_status' => 'diubah',
            ],
        );

        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHas('success', 'Laporan Anda sudah dikirim.');

        $expectedAttributes = array_merge($originalAttributes, [
            'refund_status' => 'dilaporkan',
            'updated_at' => $session->fresh()->getRawOriginal('updated_at'),
        ]);

        $this->assertSame($expectedAttributes, $session->fresh()->getRawOriginal());
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'refund_status' => 'dilaporkan',
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
            'refund_proof' => 'refund-proofs/sample.pdf',
            'payment_dp_status' => 'menunggu_verifikasi',
        ]);
    }

    public function test_decision_is_required_and_must_be_valid(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createRefundSession($student, $mentor);
        $originalAttributes = $session->getRawOriginal();

        // Empty decision
        $response1 = $this->actingAs($student)
            ->from(route('student.bookings.index'))
            ->patch(route('student.bookings.refund.confirm', $session->id), [
                'decision' => '',
            ]);

        $response1->assertRedirect(route('student.bookings.index'));
        $response1->assertSessionHasErrors('decision');
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());

        // Invalid decision string
        $response2 = $this->actingAs($student)
            ->from(route('student.bookings.index'))
            ->patch(route('student.bookings.refund.confirm', $session->id), [
                'decision' => 'tolak',
            ]);

        $response2->assertRedirect(route('student.bookings.index'));
        $response2->assertSessionHasErrors('decision');
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());

        // Non-string decision
        $response3 = $this->actingAs($student)
            ->from(route('student.bookings.index'))
            ->patch(route('student.bookings.refund.confirm', $session->id), [
                'decision' => ['sudah_terima'],
            ]);

        $response3->assertRedirect(route('student.bookings.index'));
        $response3->assertSessionHasErrors('decision');
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_another_student_cannot_confirm_refund_and_session_remains_unchanged(): void
    {
        $student = User::factory()->create();
        $anotherStudent = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createRefundSession($student, $mentor);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($anotherStudent)->patch(
            route('student.bookings.refund.confirm', $session->id),
            ['decision' => 'sudah_terima'],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_session_with_other_refund_statuses_cannot_be_confirmed(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();

        $statuses = ['menunggu', 'tidak_berlaku', 'selesai', 'dilaporkan'];

        foreach ($statuses as $refundStatus) {
            $session = $this->createRefundSession($student, $mentor, [
                'refund_status' => $refundStatus,
            ]);
            $originalAttributes = $session->getRawOriginal();

            $response = $this->actingAs($student)->patch(
                route('student.bookings.refund.confirm', $session->id),
                ['decision' => 'sudah_terima'],
            );

            $response->assertNotFound();
            $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
        }
    }

    public function test_mentor_calling_confirm_refund_receives_not_found(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createRefundSession($student, $mentor);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->actingAs($mentor)->patch(
            route('student.bookings.refund.confirm', $session->id),
            ['decision' => 'sudah_terima'],
        );

        $response->assertNotFound();
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    public function test_guest_is_redirected_to_login_when_confirming_refund(): void
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $session = $this->createRefundSession($student, $mentor);
        $originalAttributes = $session->getRawOriginal();

        $response = $this->patch(
            route('student.bookings.refund.confirm', $session->id),
            ['decision' => 'sudah_terima'],
        );

        $response->assertRedirect(route('login'));
        $this->assertSame($originalAttributes, $session->fresh()->getRawOriginal());
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createRefundSession(
        User $student,
        User $mentor,
        array $overrides = [],
    ): MentoringSession {
        return MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => '2026-10-25 10:00:00',
            'end_time' => '2026-10-25 11:00:00',
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'menunggu_verifikasi',
            'payment_dp_proof' => 'payment-proofs/dp.jpg',
            'cancelled_by' => 'mentor',
            'cancellation_reason' => null,
            'refund_proof' => 'refund-proofs/sample.pdf',
            'refund_status' => 'menunggu_konfirmasi',
            'refund_deadline' => '2026-10-27 10:00:00',
            'refund_proof_uploaded_at' => '2026-10-25 12:00:00',
        ], $overrides))->refresh();
    }
}

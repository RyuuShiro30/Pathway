<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MentoringSessionCancellationTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_cancels_confirmed_paid_session_and_sets_refund_deadline(): void
    {
        $mentor = User::factory()->create();
        $session = $this->createConfirmedSession($mentor, false);
        $this->travelTo('2026-10-06 06:00:00');

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.cancel', $session->id),
            ['cancellation_reason' => 'Jadwal mentor berubah.'],
        );

        $response->assertRedirect(route('mentor.dashboard'));
        $response->assertSessionHas('success', 'Sesi berhasil dibatalkan.');
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Jadwal mentor berubah.',
            'refund_status' => 'menunggu',
            'refund_deadline' => '2026-10-08 06:00:00',
        ]);
    }

    public function test_mentor_can_cancel_confirmed_free_session_without_refund(): void
    {
        $mentor = User::factory()->create();
        $session = $this->createConfirmedSession($mentor, true);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.cancel', $session->id),
            ['cancellation_reason' => 'Mentoring tidak dapat dilanjutkan.'],
        );

        $response->assertRedirect(route('mentor.dashboard'));
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentoring tidak dapat dilanjutkan.',
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ]);
    }

    public function test_mentor_cannot_cancel_session_after_it_has_started(): void
    {
        $mentor = User::factory()->create();
        $session = $this->createConfirmedSession($mentor, false, 'berlangsung');

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.cancel', $session->id),
            ['cancellation_reason' => 'Jadwal mentor berubah.'],
        );

        $response->assertNotFound();
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'berlangsung',
            'cancelled_by' => null,
            'refund_status' => 'tidak_berlaku',
        ]);
    }

    public function test_another_user_cannot_cancel_a_mentor_session(): void
    {
        $mentor = User::factory()->create();
        $anotherUser = User::factory()->create();
        $session = $this->createConfirmedSession($mentor, false);

        $response = $this->actingAs($anotherUser)->patch(
            route('mentor.session.cancel', $session->id),
            ['cancellation_reason' => 'Jadwal mentor berubah.'],
        );

        $response->assertNotFound();
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dikonfirmasi',
            'cancelled_by' => null,
        ]);
    }

    public function test_cancellation_reason_is_required(): void
    {
        $mentor = User::factory()->create();
        $session = $this->createConfirmedSession($mentor, false);

        $response = $this->actingAs($mentor)
            ->from(route('mentor.session.tracking', $session->id))
            ->patch(route('mentor.session.cancel', $session->id), [
                'cancellation_reason' => '',
            ]);

        $response->assertRedirect(route('mentor.session.tracking', $session->id));
        $response->assertSessionHasErrors('cancellation_reason');
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dikonfirmasi',
            'cancelled_by' => null,
        ]);
    }

    public function test_unauthenticated_user_is_redirected_to_login_when_cancelling_session(): void
    {
        $mentor = User::factory()->create();
        $session = $this->createConfirmedSession($mentor, false);

        $response = $this->patch(route('mentor.session.cancel', $session->id), [
            'cancellation_reason' => 'Jadwal mentor berubah.',
        ]);

        $response->assertRedirect(route('login'));
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dikonfirmasi',
            'cancelled_by' => null,
        ]);
    }

    private function createConfirmedSession(
        User $mentor,
        bool $isFreeSession,
        string $status = 'dikonfirmasi',
    ): MentoringSession {
        $student = User::factory()->create();

        return MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => $status,
            'schedule_time' => '2026-10-07 09:00:00',
            'end_time' => '2026-10-07 10:00:00',
            'duration_hours' => 1,
            'is_free_session' => $isFreeSession,
            'price_snapshot' => $isFreeSession ? 0 : 100000,
        ]);
    }
}

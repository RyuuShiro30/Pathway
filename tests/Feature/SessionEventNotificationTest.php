<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class SessionEventNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_cancelling_request_notifies_mentor(): void
    {
        [$student, $mentor, $session] = $this->createSession('diajukan');

        $this->actingAs($student)
            ->patch(route('student.bookings.cancel', $session->id), [
                'cancellation_reason' => 'Berhalangan.',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(1, $mentor->unreadNotifications()->count());
        $this->assertSame(0, $student->unreadNotifications()->count());
    }

    public function test_mentor_starting_session_notifies_student(): void
    {
        [$student, $mentor, $session] = $this->createSession('dikonfirmasi');

        $this->actingAs($mentor)
            ->patch(route('mentor.session.start', $session->id))
            ->assertSessionHasNoErrors();

        $this->assertSame(1, $student->unreadNotifications()->count());
        $this->assertSame(0, $mentor->unreadNotifications()->count());
    }

    /**
     * @return array{0: User, 1: User, 2: MentoringSession}
     */
    private function createSession(string $status): array
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $start = Carbon::now()->addDays(2);

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => $status,
            'schedule_time' => $start,
            'end_time' => $start->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        return [$student, $mentor, $session];
    }
}

<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentCancellationReasonTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_sees_reason_for_system_cancellation(): void
    {
        [$student] = $this->createCancelledSession(
            'sistem',
            'Dibatalkan otomatis: mentor tidak merespons dalam 24 jam.',
        );

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('bookings.0.cancelled_by', 'sistem')
                ->where(
                    'bookings.0.cancellation_reason',
                    'Dibatalkan otomatis: mentor tidak merespons dalam 24 jam.',
                ));
    }

    public function test_student_does_not_receive_reason_written_by_mentor(): void
    {
        [$student] = $this->createCancelledSession('mentor', 'Alasan pribadi mentor.');

        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('bookings.0.cancelled_by', 'mentor')
                ->where('bookings.0.cancellation_reason', null));
    }

    /**
     * @return array{0: User, 1: User, 2: MentoringSession}
     */
    private function createCancelledSession(string $cancelledBy, string $reason): array
    {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $scheduleTime = Carbon::parse('2026-10-20 10:00:00');

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'cancelled_by' => $cancelledBy,
            'cancellation_reason' => $reason,
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        return [$student, $mentor, $session];
    }
}

<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AutoCancelBookingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_paid_booking_with_overdue_schedule_is_cancelled_with_refund_waiting(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        $session = $this->createBooking(false, [
            'schedule_time' => now()->subHour(),
            'end_time' => now(),
        ]);

        $this->artisan('bookings:auto-cancel')->assertSuccessful();

        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('sistem', $session->cancelled_by);
        $this->assertStringContainsString('terlewat', $session->cancellation_reason);
        $this->assertSame('menunggu', $session->refund_status);
        $this->assertTrue($session->refund_deadline->equalTo(now()->addHours(48)));
        $this->assertSame('menunggu_verifikasi', $session->payment_dp_status);
        $this->assertSame('payment-proofs/test_dp.jpg', $session->payment_dp_proof);
    }

    public function test_paid_booking_without_response_for_24_hours_is_cancelled_with_refund_waiting(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        $session = $this->createBooking(false, [], 25);

        $this->artisan('bookings:auto-cancel')->assertSuccessful();

        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('sistem', $session->cancelled_by);
        $this->assertStringContainsString('tidak merespons', $session->cancellation_reason);
        $this->assertSame('menunggu', $session->refund_status);
        $this->assertTrue($session->refund_deadline->equalTo(now()->addHours(48)));
    }

    public function test_free_booking_without_response_is_cancelled_without_refund(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        $session = $this->createBooking(true, [], 25);

        $this->artisan('bookings:auto-cancel')->assertSuccessful();

        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('sistem', $session->cancelled_by);
        $this->assertSame('tidak_berlaku', $session->refund_status);
        $this->assertNull($session->refund_deadline);
    }

    public function test_booking_under_24_hours_with_future_schedule_is_not_cancelled(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        $session = $this->createBooking(false, [], 23);

        $this->artisan('bookings:auto-cancel')->assertSuccessful();

        $session->refresh();

        $this->assertSame('diajukan', $session->status);
        $this->assertNull($session->cancelled_by);
        $this->assertSame('tidak_berlaku', $session->refund_status);
    }

    public function test_confirmed_booking_is_not_touched_even_if_schedule_is_overdue(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        $session = $this->createBooking(false, [
            'status' => 'dikonfirmasi',
            'schedule_time' => now()->subHour(),
            'end_time' => now(),
        ], 48);

        $this->artisan('bookings:auto-cancel')->assertSuccessful();

        $session->refresh();

        $this->assertSame('dikonfirmasi', $session->status);
        $this->assertNull($session->cancelled_by);
    }

    public function test_already_cancelled_booking_keeps_its_original_data(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        $session = $this->createBooking(true, [
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentee',
            'cancellation_reason' => 'Alasan awal student',
        ], 48);

        $this->artisan('bookings:auto-cancel')->assertSuccessful();

        $session->refresh();

        $this->assertSame('mentee', $session->cancelled_by);
        $this->assertSame('Alasan awal student', $session->cancellation_reason);
    }

    public function test_running_the_command_twice_does_not_change_the_refund_deadline(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        $session = $this->createBooking(false, [], 25);

        $this->artisan('bookings:auto-cancel')->assertSuccessful();

        $firstDeadline = $session->refresh()->refund_deadline->copy();

        $this->travelTo('2026-10-20 11:00:00');

        $this->artisan('bookings:auto-cancel')->assertSuccessful();

        $this->assertTrue($session->refresh()->refund_deadline->equalTo($firstDeadline));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createBooking(
        bool $isFreeSession,
        array $overrides = [],
        int $createdHoursAgo = 0,
    ): MentoringSession {
        $student = User::factory()->create();
        $mentor = User::factory()->create();
        $scheduleTime = now()->addDays(3)->setTime(9, 0);

        $session = MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => $isFreeSession,
            'price_snapshot' => $isFreeSession ? 0 : 100000,
            'payment_dp_status' => $isFreeSession ? 'tidak_berlaku' : 'menunggu_verifikasi',
            'payment_dp_proof' => $isFreeSession ? null : 'payment-proofs/test_dp.jpg',
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ], $overrides));

        if ($createdHoursAgo > 0) {
            $session->created_at = now()->subHours($createdHoursAgo);
            $session->save();
        }

        return $session->refresh();
    }
}

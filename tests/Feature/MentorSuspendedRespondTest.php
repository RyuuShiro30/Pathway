<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\MentorSuspension;
use App\Models\User;
use App\Services\MentorSuspensionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MentorSuspendedRespondTest extends TestCase
{
    use RefreshDatabase;

    public function test_suspended_mentor_cannot_accept_a_booking(): void
    {
        [$mentor, $session] = $this->createSuspendedMentorWithBooking(false);

        $this->actingAs($mentor)
            ->patch(route('mentor.booking.respond', $session->id), ['action' => 'terima'])
            ->assertSessionHasErrors('message');

        $session->refresh();

        $this->assertSame('diajukan', $session->status);
        $this->assertNull($session->discord_link);
        $this->assertSame('menunggu_verifikasi', $session->payment_dp_status);
    }

    public function test_suspended_mentor_can_still_reject_a_paid_booking_with_refund(): void
    {
        [$mentor, $session] = $this->createSuspendedMentorWithBooking(false);

        $this->actingAs($mentor)
            ->patch(route('mentor.booking.respond', $session->id), ['action' => 'tolak'])
            ->assertRedirect(route('mentor.dashboard'))
            ->assertSessionHas('success');

        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentor', $session->cancelled_by);
        $this->assertSame('menunggu', $session->refund_status);
    }

    public function test_suspended_mentor_can_still_reject_a_free_booking(): void
    {
        [$mentor, $session] = $this->createSuspendedMentorWithBooking(true);

        $this->actingAs($mentor)
            ->patch(route('mentor.booking.respond', $session->id), ['action' => 'tolak'])
            ->assertRedirect(route('mentor.dashboard'));

        $this->assertSame('dibatalkan', $session->refresh()->status);
    }

    public function test_mentor_can_accept_again_after_suspension_is_lifted(): void
    {
        [$mentor, $session] = $this->createSuspendedMentorWithBooking(true);

        app(MentorSuspensionService::class)->lift($mentor->id);

        $this->actingAs($mentor)
            ->patch(route('mentor.booking.respond', $session->id), ['action' => 'terima'])
            ->assertRedirect(route('mentor.dashboard'))
            ->assertSessionHas('success');

        $session->refresh();

        $this->assertSame('dikonfirmasi', $session->status);
        $this->assertSame('https://discord.gg/mentor-room', $session->discord_link);
    }

    public function test_mentor_who_was_never_suspended_can_accept(): void
    {
        $mentor = $this->createMentor();
        $session = $this->createBooking($mentor, true);

        $this->actingAs($mentor)
            ->patch(route('mentor.booking.respond', $session->id), ['action' => 'terima'])
            ->assertRedirect(route('mentor.dashboard'));

        $this->assertSame('dikonfirmasi', $session->refresh()->status);
    }

    /**
     * @return array{0: User, 1: MentoringSession}
     */
    private function createSuspendedMentorWithBooking(bool $isFree): array
    {
        $mentor = $this->createMentor();
        $session = $this->createBooking($mentor, $isFree);

        app(MentorSuspensionService::class)->suspend(
            $mentor->id,
            MentorSuspension::REASON_LATE_REFUND,
        );

        return [$mentor, $session];
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

    private function createBooking(User $mentor, bool $isFree): MentoringSession
    {
        $student = User::factory()->create();
        $scheduleTime = now()->addDays(3)->setTime(9, 0);

        return MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => $isFree,
            'price_snapshot' => $isFree ? 0 : 100000,
            'payment_dp_status' => $isFree ? 'tidak_berlaku' : 'menunggu_verifikasi',
            'payment_dp_proof' => $isFree ? null : 'payment-proofs/test_dp.jpg',
            'refund_status' => 'tidak_berlaku',
        ])->refresh();
    }
}

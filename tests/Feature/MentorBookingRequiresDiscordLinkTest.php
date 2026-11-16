<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MentorBookingRequiresDiscordLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_without_discord_link_cannot_accept_booking(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $mentor = $this->createMentor();
        $session = $this->createBooking($mentor);

        $response = $this->actingAs($mentor)
            ->from(route('mentor.dashboard'))
            ->patch(route('mentor.booking.respond', $session->id), [
                'action' => 'terima',
            ]);

        $response->assertRedirect(route('mentor.dashboard'));
        $response->assertSessionHasErrors([
            'message' => 'Link room Discord Anda belum diisi oleh admin, jadi pengajuan belum dapat diterima. Hubungi admin untuk mengisi link room-nya. Anda masih bisa menolak pengajuan.',
        ]);

        $session->refresh();
        $this->assertSame('diajukan', $session->status);
        $this->assertNull($session->discord_link);
    }

    public function test_mentor_without_discord_link_can_still_reject_booking(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $mentor = $this->createMentor();
        $session = $this->createBooking($mentor);

        $response = $this->actingAs($mentor)
            ->patch(route('mentor.booking.respond', $session->id), [
                'action' => 'tolak',
            ]);

        $response->assertRedirect(route('mentor.dashboard'));
        $response->assertSessionHas('success', 'Permintaan berhasil ditolak');
        $this->assertSame('dibatalkan', $session->fresh()->status);
    }

    public function test_mentor_can_accept_booking_after_admin_fills_discord_link(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $admin = User::factory()->admin()->create();
        $mentor = $this->createMentor();
        $session = $this->createBooking($mentor);

        $profile = MentorProfile::query()->where('user_id', $mentor->id)->firstOrFail();

        $this->actingAs($admin)
            ->patch(route('admin.mentors.discord', $profile->id), [
                'discord_room_link' => 'https://discord.gg/room-baru',
            ]);

        $this->actingAs($mentor)
            ->patch(route('mentor.booking.respond', $session->id), [
                'action' => 'terima',
            ])
            ->assertRedirect(route('mentor.dashboard'))
            ->assertSessionHas('success', 'Booking berhasil dikonfirmasi');

        $session->refresh();
        $this->assertSame('dikonfirmasi', $session->status);
        $this->assertSame('https://discord.gg/room-baru', $session->discord_link);
    }

    public function test_mentor_dashboard_reports_missing_discord_link(): void
    {
        $this->travelTo('2026-11-20 12:00:00');

        $mentor = $this->createMentor();

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('mentorProfile.discord_room_link', null));
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->mentor()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
        ]);

        return $mentor;
    }

    private function createBooking(User $mentor): MentoringSession
    {
        $scheduleTime = now()->addDays(3)->setTime(9, 0);

        return MentoringSession::query()->create([
            'student_id' => User::factory()->create()->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ])->refresh();
    }
}

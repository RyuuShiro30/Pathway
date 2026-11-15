<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MentorDashboardPendingFinalPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_lists_only_own_sessions_awaiting_final_payment_verification(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        $mentor = $this->createMentor();
        $otherMentor = $this->createMentor();
        $student = User::factory()->create();

        // Milik mentor ini dengan payment_final_status = 'menunggu_verifikasi'
        $session1 = $this->createSession(
            $mentor,
            $student,
            'selesai',
            now()->addDay(),
            'menunggu_verifikasi'
        );

        $session2 = $this->createSession(
            $mentor,
            $student,
            'berlangsung',
            now()->addDays(2),
            'menunggu_verifikasi'
        );

        // Milik mentor ini tapi status bukan menunggu_verifikasi
        $this->createSession($mentor, $student, 'selesai', now()->addDays(3), 'terverifikasi');
        $this->createSession($mentor, $student, 'selesai', now()->addDays(4), 'belum_dibayar');
        $this->createSession($mentor, $student, 'selesai', now()->addDays(5), 'ditolak');

        // Milik mentor lain dengan menunggu_verifikasi (tidak boleh muncul)
        $this->createSession($otherMentor, $student, 'selesai', now()->addDay(), 'menunggu_verifikasi');

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mentor/Dashboard')
                ->has('pendingFinalPayments', 2)
                ->where('pendingFinalPayments.0.id', $session1->id)
                ->where('pendingFinalPayments.0.payment_final_status', 'menunggu_verifikasi')
                ->where('pendingFinalPayments.0.student.name', $student->name)
                ->where('pendingFinalPayments.1.id', $session2->id)
                ->where('pendingFinalPayments.1.payment_final_status', 'menunggu_verifikasi')
            );
    }

    public function test_pending_final_payments_is_empty_when_mentor_has_none(): void
    {
        $mentor = $this->createMentor();

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Mentor/Dashboard')
                ->has('pendingFinalPayments', 0)
            );
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->mentor()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);

        return $mentor;
    }

    private function createSession(
        User $mentor,
        User $student,
        string $status,
        Carbon $scheduleTime,
        string $paymentFinalStatus,
    ): MentoringSession {
        return MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => $status,
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'terverifikasi',
            'payment_final_status' => $paymentFinalStatus,
            'refund_status' => 'tidak_berlaku',
        ]);
    }
}


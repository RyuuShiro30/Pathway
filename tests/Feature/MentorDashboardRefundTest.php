<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class MentorDashboardRefundTest extends TestCase
{
    use RefreshDatabase;

    public function test_mentor_dashboard_only_contains_pending_refund_sessions_for_logged_in_mentor(): void
    {
        $mentor = $this->createMentor();
        $otherMentor = $this->createMentor();
        $student = User::factory()->create();

        $ownRefund = $this->createSession($mentor, $student, [
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(24),
        ]);
        $this->createSession($otherMentor, $student, [
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(12),
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Mentor/Dashboard', false)
                ->has('refundRequests', 1)
                ->where('refundRequests.0.id', $ownRefund->id)
                ->etc());
    }

    public function test_mentor_dashboard_excludes_sessions_with_other_refund_statuses(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();

        $waitingRefund = $this->createSession($mentor, $student, [
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(24),
        ]);
        $this->createSession($mentor, $student, [
            'refund_status' => 'menunggu_konfirmasi',
            'refund_deadline' => now()->addHours(24),
        ]);
        $this->createSession($mentor, $student, [
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Mentor/Dashboard', false)
                ->has('refundRequests', 1)
                ->where('refundRequests.0.id', $waitingRefund->id)
                ->etc());
    }

    public function test_mentor_dashboard_refund_requests_only_exposes_safe_columns_and_student_id_and_name(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create([
            'name' => 'Budi Mentee',
            'email' => 'budi@example.test',
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Budi Mentee',
        ]);

        $session = $this->createSession($mentor, $student, [
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(36),
            'price_snapshot' => 150000,
            'payment_dp_proof' => 'payment-proofs/dp.jpg',
            'refund_proof' => null,
            'cancellation_reason' => 'Alasan pembatalan rahasia',
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Mentor/Dashboard', false)
                ->has('refundRequests', 1)
                ->where('refundRequests.0.id', $session->id)
                ->has('refundRequests.0.schedule_time')
                ->has('refundRequests.0.end_time')
                ->has('refundRequests.0.refund_deadline')
                ->where('refundRequests.0.student.id', $student->id)
                ->where('refundRequests.0.student.name', 'Budi Mentee')
                ->missing('refundRequests.0.student_id')
                ->missing('refundRequests.0.student.email')
                ->missing('refundRequests.0.student.bank_name')
                ->missing('refundRequests.0.student.bank_account_number')
                ->missing('refundRequests.0.student.bank_account_holder')
                ->missing('refundRequests.0.payment_dp_proof')
                ->missing('refundRequests.0.payment_dp_status')
                ->missing('refundRequests.0.refund_proof')
                ->missing('refundRequests.0.price_snapshot')
                ->missing('refundRequests.0.cancellation_reason')
                ->etc());
    }

    public function test_mentor_dashboard_refund_requests_are_sorted_by_refund_deadline_ascending(): void
    {
        $mentor = $this->createMentor();
        $student = User::factory()->create();

        $laterSession = $this->createSession($mentor, $student, [
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(40),
        ]);
        $earlierSession = $this->createSession($mentor, $student, [
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(10),
        ]);

        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Mentor/Dashboard', false)
                ->has('refundRequests', 2)
                ->where('refundRequests.0.id', $earlierSession->id)
                ->where('refundRequests.1.id', $laterSession->id)
                ->etc());
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Backend Development',
        ]);

        return $mentor;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createSession(User $mentor, User $student, array $overrides = []): MentoringSession
    {
        $scheduleTime = now()->addDays(2)->setTime(14, 0);

        return MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'menunggu_verifikasi',
            'payment_dp_proof' => 'payment-proofs/sample.png',
            'cancelled_by' => 'mentor',
            'cancellation_reason' => null,
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(48),
        ], $overrides));
    }
}

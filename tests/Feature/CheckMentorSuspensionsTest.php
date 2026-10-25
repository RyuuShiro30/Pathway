<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\MentorSuspension;
use App\Models\NoShowReport;
use App\Models\User;
use App\Services\MentorSuspensionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class CheckMentorSuspensionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_overdue_refund_suspends_mentor(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $session = $this->createRefundSession($mentor, 'menunggu', now()->subHour());

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $suspension = MentorSuspension::query()->where('mentor_id', $mentor->id)->firstOrFail();

        $this->assertSame('refund_terlambat', $suspension->reason);
        $this->assertSame($session->id, $suspension->session_id);
        $this->assertNull($suspension->lifted_at);
        $this->assertTrue($this->profileOf($mentor)->is_suspended);
    }

    public function test_refund_not_yet_due_does_not_suspend(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createRefundSession($mentor, 'menunggu', now()->addHour());

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $this->assertSame(0, MentorSuspension::query()->count());
        $this->assertFalse($this->profileOf($mentor)->is_suspended);
    }

    public function test_refund_with_uploaded_slip_does_not_suspend(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createRefundSession($mentor, 'menunggu_konfirmasi', now()->subHour());

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $this->assertSame(0, MentorSuspension::query()->count());
    }

    public function test_lifted_suspension_is_not_reapplied_for_the_same_refund(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createRefundSession($mentor, 'menunggu', now()->subHour());

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        app(MentorSuspensionService::class)->lift($mentor->id);

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $this->assertSame(1, MentorSuspension::query()->where('mentor_id', $mentor->id)->count());
        $this->assertFalse($this->profileOf($mentor)->is_suspended);
    }

    public function test_three_valid_no_show_reports_suspend_mentor(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(1));
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(5));
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(10));

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $suspension = MentorSuspension::query()->where('mentor_id', $mentor->id)->firstOrFail();

        $this->assertSame('no_show_berulang', $suspension->reason);
        $this->assertTrue($this->profileOf($mentor)->is_suspended);
    }

    public function test_two_reports_do_not_suspend(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(1));
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(2));

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $this->assertSame(0, MentorSuspension::query()->count());
    }

    public function test_report_older_than_30_days_is_not_counted(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(1));
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(2));
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(31));

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $this->assertSame(0, MentorSuspension::query()->count());
    }

    public function test_disputed_or_closed_reports_are_not_counted(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(1));
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(2));
        $this->createNoShowReport($mentor, 'disanggah', null);
        $this->createNoShowReport($mentor, 'tidak_berlaku', now()->subDays(3));

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $this->assertSame(0, MentorSuspension::query()->count());
    }

    public function test_student_no_show_reports_do_not_suspend_the_mentor(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(1), false);
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(2), false);
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(3), false);

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $this->assertSame(0, MentorSuspension::query()->count());
    }

    public function test_old_reports_are_not_reused_after_suspension_is_lifted(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(1));
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(2));
        $this->createNoShowReport($mentor, 'berlaku', now()->subDays(3));

        $this->artisan('mentors:check-suspensions')->assertSuccessful();
        $this->assertTrue($this->profileOf($mentor)->is_suspended);

        app(MentorSuspensionService::class)->lift($mentor->id);

        $this->artisan('mentors:check-suspensions')->assertSuccessful();
        $this->assertFalse($this->profileOf($mentor)->is_suspended);

        $this->createNoShowReport($mentor, 'berlaku', now());

        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $this->assertFalse($this->profileOf($mentor)->is_suspended);
        $this->assertSame(1, MentorSuspension::query()->where('mentor_id', $mentor->id)->count());
    }

    public function test_running_twice_does_not_duplicate_suspension(): void
    {
        $this->travelTo('2026-10-25 12:00:00');

        $mentor = $this->createMentor();
        $this->createRefundSession($mentor, 'menunggu', now()->subHour());

        $this->artisan('mentors:check-suspensions')->assertSuccessful();
        $this->artisan('mentors:check-suspensions')->assertSuccessful();

        $this->assertSame(1, MentorSuspension::query()->where('mentor_id', $mentor->id)->count());
    }

    private function profileOf(User $mentor): MentorProfile
    {
        return MentorProfile::query()->where('user_id', $mentor->id)->firstOrFail();
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

    private function createRefundSession(User $mentor, string $refundStatus, Carbon $deadline): MentoringSession
    {
        $student = User::factory()->create();
        $scheduleTime = now()->subDays(3);

        return MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'terverifikasi',
            'payment_dp_proof' => 'payment-proofs/test_dp.jpg',
            'refund_status' => $refundStatus,
            'refund_deadline' => $deadline,
        ]);
    }

    private function createNoShowReport(
        User $mentor,
        string $status,
        ?Carbon $finalizedAt,
        bool $againstMentor = true,
    ): NoShowReport {
        $student = User::factory()->create();
        $scheduleTime = now()->subDays(2);

        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'cancelled_by' => $againstMentor ? 'mentor' : 'mentee',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        return NoShowReport::query()->create([
            'session_id' => $session->id,
            'reporter_id' => $againstMentor ? $student->id : $mentor->id,
            'reported_user_id' => $againstMentor ? $mentor->id : $student->id,
            'status' => $status,
            'evidence_path' => 'no-show-reports/bukti.png',
            'respond_deadline' => now()->subDay(),
            'finalized_at' => $finalizedAt,
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use App\Notifications\SessionEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPaymentReminderTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::factory()->admin()->create();
    }

    private function createStudent(): User
    {
        return User::factory()->student()->create();
    }

    private function createMentor(): User
    {
        return User::factory()->mentor()->create();
    }

    public function test_non_admin_cannot_access_payment_reminders_and_returns_404(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $session = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'belum_dibayar',
            'schedule_time' => now()->subDay(),
        ]);

        // Student accessing index
        $this->actingAs($student)
            ->get(route('admin.payment-reminders.index'))
            ->assertNotFound();

        // Mentor accessing index
        $this->actingAs($mentor)
            ->get(route('admin.payment-reminders.index'))
            ->assertNotFound();

        // Student attempting to trigger remind
        $this->actingAs($student)
            ->post(route('admin.payment-reminders.remind', $session->id))
            ->assertNotFound();

        // Student attempting to trigger remind-all
        $this->actingAs($student)
            ->post(route('admin.payment-reminders.remind-all'))
            ->assertNotFound();
    }

    public function test_admin_sees_correct_list_and_excludes_free_or_verified_or_pending_verification(): void
    {
        $admin = $this->createAdmin();
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        // 1. Valid: selesai + belum_dibayar
        $session1 = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'belum_dibayar',
            'schedule_time' => now()->subDays(2),
        ]);

        // 2. Valid: berlangsung + ditolak
        $session2 = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'berlangsung',
            'is_free_session' => false,
            'price_snapshot' => 200000,
            'payment_final_status' => 'ditolak',
            'schedule_time' => now()->subDay(),
        ]);

        // 3. Excluded: free session
        $sessionFree = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_final_status' => 'tidak_berlaku',
            'schedule_time' => now()->subDays(3),
        ]);

        // 4. Excluded: terverifikasi
        $sessionVerified = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 150000,
            'payment_final_status' => 'terverifikasi',
            'schedule_time' => now()->subDays(4),
        ]);

        // 5. Excluded: menunggu_verifikasi
        $sessionPendingVerification = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 150000,
            'payment_final_status' => 'menunggu_verifikasi',
            'schedule_time' => now()->subDays(5),
        ]);

        // 6. Excluded: status diajukan (belum berlangsung / selesai)
        $sessionDiajukan = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'belum_dibayar',
            'schedule_time' => now()->addDay(),
        ]);

        // 7. Excluded: status dibatalkan
        $sessionDibatalkan = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'belum_dibayar',
            'schedule_time' => now()->subDays(6),
        ]);

        $response = $this->actingAs($admin)->get(route('admin.payment-reminders.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/PaymentReminder/Index')
            ->has('reminders', 2)
            ->where('reminders.0.id', $session1->id)
            ->where('reminders.0.can_remind', true)
            ->where('reminders.0.final_amount', 50000)
            ->where('reminders.1.id', $session2->id)
            ->where('reminders.1.can_remind', true)
            ->where('reminders.1.final_amount', 100000)
            ->where('total', 2)
            ->where('canRemindCount', 2)
            ->where('counts.total', 2)
            ->where('counts.belum_dibayar', 1)
            ->where('counts.ditolak', 1)
        );
    }

    public function test_remind_sends_notification_to_correct_student_and_sets_reminded_at(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        $session = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'belum_dibayar',
            'schedule_time' => now()->subDay(),
            'payment_final_reminded_at' => null,
        ]);

        $response = $this->actingAs($admin)
            ->post(route('admin.payment-reminders.remind', $session->id));

        $response->assertSessionHas('success');

        $session->refresh();
        $this->assertNotNull($session->payment_final_reminded_at);

        Notification::assertSentTo(
            $student,
            SessionEvent::class,
            function (SessionEvent $notification) use ($student, $mentor) {
                $payload = $notification->toArray($student);

                return $payload['message'] === "Pengingat: sisa pelunasan 50% untuk sesi mentoring bersama {$mentor->name} belum dibayar. Silakan upload bukti pelunasan."
                    && $payload['url'] === '/bookings';
            }
        );
    }

    public function test_second_remind_within_24_hours_is_rejected(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        $twoHoursAgo = now()->subHours(2);

        $session = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'belum_dibayar',
            'schedule_time' => now()->subDays(2),
            'payment_final_reminded_at' => $twoHoursAgo,
        ]);

        $response = $this->actingAs($admin)
            ->post(route('admin.payment-reminders.remind', $session->id));

        $response->assertSessionHas('error');
        $response->assertSessionHasErrors('session');

        Notification::assertNothingSent();

        $session->refresh();
        $this->assertEquals(
            $twoHoursAgo->toDateTimeString(),
            $session->payment_final_reminded_at->toDateTimeString()
        );
    }

    public function test_remind_allowed_after_24_hours(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        $twentyFiveHoursAgo = now()->subHours(25);

        $session = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'belum_dibayar',
            'schedule_time' => now()->subDays(3),
            'payment_final_reminded_at' => $twentyFiveHoursAgo,
        ]);

        $response = $this->actingAs($admin)
            ->post(route('admin.payment-reminders.remind', $session->id));

        $response->assertSessionHas('success');

        Notification::assertSentTo($student, SessionEvent::class);

        $session->refresh();
        $this->assertTrue($session->payment_final_reminded_at->gt($twentyFiveHoursAgo));
    }

    public function test_remind_rejected_if_session_not_eligible(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        // Sesi sudah terverifikasi
        $session = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'terverifikasi',
            'schedule_time' => now()->subDay(),
        ]);

        $response = $this->actingAs($admin)
            ->post(route('admin.payment-reminders.remind', $session->id));

        $response->assertSessionHas('error');
        $response->assertSessionHasErrors('session');

        Notification::assertNothingSent();
    }

    public function test_remind_all_processes_only_eligible_sessions(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $student1 = $this->createStudent();
        $student2 = $this->createStudent();
        $student3 = $this->createStudent();
        $student4 = $this->createStudent();
        $mentor = $this->createMentor();

        // 1. Eligible: belum_dibayar, never reminded
        $session1 = MentoringSession::create([
            'student_id' => $student1->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'belum_dibayar',
            'schedule_time' => now()->subDays(2),
            'payment_final_reminded_at' => null,
        ]);

        // 2. Eligible: ditolak, reminded 25 hours ago
        $session2 = MentoringSession::create([
            'student_id' => $student2->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'ditolak',
            'schedule_time' => now()->subDays(3),
            'payment_final_reminded_at' => now()->subHours(25),
        ]);

        // 3. Ineligible: reminded 2 hours ago
        $session3RemindedRecently = now()->subHours(2);
        $session3 = MentoringSession::create([
            'student_id' => $student3->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'belum_dibayar',
            'schedule_time' => now()->subDays(4),
            'payment_final_reminded_at' => $session3RemindedRecently,
        ]);

        // 4. Ineligible: already terverifikasi
        $session4 = MentoringSession::create([
            'student_id' => $student4->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_final_status' => 'terverifikasi',
            'schedule_time' => now()->subDays(5),
            'payment_final_reminded_at' => null,
        ]);

        $response = $this->actingAs($admin)
            ->post(route('admin.payment-reminders.remind-all'));

        $response->assertSessionHas('success');

        // Notification must be sent to student1 and student2
        Notification::assertSentTo($student1, SessionEvent::class);
        Notification::assertSentTo($student2, SessionEvent::class);

        // Notification must NOT be sent to student3 and student4
        Notification::assertNotSentTo($student3, SessionEvent::class);
        Notification::assertNotSentTo($student4, SessionEvent::class);

        $session1->refresh();
        $session2->refresh();
        $session3->refresh();

        $this->assertNotNull($session1->payment_final_reminded_at);
        $this->assertTrue($session2->payment_final_reminded_at->gt(now()->subMinutes(1)));
        $this->assertEquals(
            $session3RemindedRecently->toDateTimeString(),
            $session3->payment_final_reminded_at->toDateTimeString()
        );
    }
}

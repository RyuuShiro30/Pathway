<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\User;
use App\Notifications\SessionEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminRefundReportTest extends TestCase
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

    public function test_non_admin_cannot_access_refund_reports_and_remind(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        $session = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'refund_status' => 'menunggu_konfirmasi',
            'refund_proof_uploaded_at' => now()->subHours(5),
            'schedule_time' => now()->subDays(2),
        ]);

        // Unauthenticated access redirects to admin login
        $this->get(route('admin.refund-reports.index'))
            ->assertRedirect(route('admin.login'));

        // Student accessing index returns 404
        $this->actingAs($student)
            ->get(route('admin.refund-reports.index'))
            ->assertNotFound();

        // Mentor accessing index returns 404
        $this->actingAs($mentor)
            ->get(route('admin.refund-reports.index'))
            ->assertNotFound();

        // Student attempting remind returns 404
        $this->actingAs($student)
            ->post(route('admin.refund-reports.remind', $session->id))
            ->assertNotFound();

        // Mentor attempting remind returns 404
        $this->actingAs($mentor)
            ->post(route('admin.refund-reports.remind', $session->id))
            ->assertNotFound();
    }

    public function test_admin_list_loads_new_status_counts_and_remaining_time(): void
    {
        $admin = $this->createAdmin();
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        $sessionDilaporkan = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'refund_status' => 'dilaporkan',
            'schedule_time' => now()->subDays(2),
        ]);

        $sessionMenungguKonfirmasi = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'refund_status' => 'menunggu_konfirmasi',
            'refund_proof_uploaded_at' => now()->subHours(5),
            'refund_reminded_at' => null,
            'schedule_time' => now()->subDays(2),
        ]);

        $sessionMenunggu = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'refund_status' => 'menunggu',
            'schedule_time' => now()->subDays(2),
        ]);

        $sessionSelesai = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'refund_status' => 'selesai',
            'schedule_time' => now()->subDays(2),
        ]);

        // 1. Access without filter -> default dilaporkan
        $response = $this->actingAs($admin)->get(route('admin.refund-reports.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/RefundReport/Index')
            ->where('counts.dilaporkan', 1)
            ->where('counts.menunggu_konfirmasi', 1)
            ->where('counts.menunggu', 1)
            ->where('counts.selesai', 1)
            ->has('reports', 1)
            ->where('reports.0.id', $sessionDilaporkan->id)
        );

        // 2. Filter status: 'menunggu_konfirmasi'
        $responseFilter = $this->actingAs($admin)->get(route('admin.refund-reports.index', ['status' => 'menunggu_konfirmasi']));
        $responseFilter->assertOk();
        $responseFilter->assertInertia(fn (Assert $page) => $page
            ->component('Admin/RefundReport/Index')
            ->where('currentStatus', 'menunggu_konfirmasi')
            ->has('reports', 1)
            ->where('reports.0.id', $sessionMenungguKonfirmasi->id)
            ->where('reports.0.refund_status', 'menunggu_konfirmasi')
            ->where('reports.0.can_remind', true)
            ->has('reports.0.remaining_time')
        );

        // 3. Filter status: 'semua' -> priority order: dilaporkan, menunggu_konfirmasi, menunggu, selesai
        $responseAll = $this->actingAs($admin)->get(route('admin.refund-reports.index', ['status' => 'semua']));
        $responseAll->assertOk();
        $responseAll->assertInertia(fn (Assert $page) => $page
            ->component('Admin/RefundReport/Index')
            ->has('reports', 4)
            ->where('reports.0.refund_status', 'dilaporkan')
            ->where('reports.1.refund_status', 'menunggu_konfirmasi')
            ->where('reports.2.refund_status', 'menunggu')
            ->where('reports.3.refund_status', 'selesai')
        );
    }

    public function test_remind_sends_notification_to_correct_student_and_fills_refund_reminded_at(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        $session = MentoringSession::create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'refund_status' => 'menunggu_konfirmasi',
            'refund_proof_uploaded_at' => now()->subHours(6),
            'refund_reminded_at' => null,
            'schedule_time' => now()->subDays(2),
        ]);

        $response = $this->actingAs($admin)
            ->post(route('admin.refund-reports.remind', $session->id));

        $response->assertSessionHas('success');

        Notification::assertSentTo(
            $student,
            SessionEvent::class,
            function (SessionEvent $notification) {
                $data = $notification->toArray(new \stdClass);

                return $data['message'] === 'Pengingat: mentor sudah mengirim bukti refund DP kamu. Silakan konfirmasi di halaman Booking. Refund akan otomatis dikonfirmasi jika tidak ada respons.'
                    && $data['url'] === '/bookings';
            }
        );

        $session->refresh();
        $this->assertNotNull($session->refund_reminded_at);
        $this->assertTrue($session->refund_reminded_at->greaterThan(now()->subMinute()));
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
            'status' => 'dibatalkan',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'refund_status' => 'menunggu_konfirmasi',
            'refund_proof_uploaded_at' => now()->subHours(10),
            'refund_reminded_at' => $twoHoursAgo,
            'schedule_time' => now()->subDays(2),
        ]);

        $response = $this->actingAs($admin)
            ->post(route('admin.refund-reports.remind', $session->id));

        $response->assertSessionHas('error');
        $response->assertSessionHasErrors('session');

        Notification::assertNothingSent();

        $session->refresh();
        $this->assertEquals(
            $twoHoursAgo->toDateTimeString(),
            $session->refund_reminded_at->toDateTimeString()
        );
    }

    public function test_remind_on_status_other_than_menunggu_konfirmasi_is_rejected(): void
    {
        Notification::fake();

        $admin = $this->createAdmin();
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        $invalidStatuses = ['dilaporkan', 'menunggu', 'selesai'];

        foreach ($invalidStatuses as $status) {
            $session = MentoringSession::create([
                'student_id' => $student->id,
                'mentor_id' => $mentor->id,
                'status' => 'dibatalkan',
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'refund_status' => $status,
                'schedule_time' => now()->subDays(2),
            ]);

            $response = $this->actingAs($admin)
                ->post(route('admin.refund-reports.remind', $session->id));

            $response->assertSessionHas('error');
            $response->assertSessionHasErrors('session');

            Notification::assertNothingSent();

            $session->refresh();
            $this->assertNull($session->refund_reminded_at);
        }
    }
}

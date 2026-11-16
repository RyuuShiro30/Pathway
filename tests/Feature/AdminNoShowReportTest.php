<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use App\Notifications\SessionEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminNoShowReportTest extends TestCase
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

    public function test_non_admin_cannot_access_no_show_reports_and_decide(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        [, $report] = $this->createReportFixture('student', false, 'disanggah');

        // Tamu tanpa login diarahkan ke login admin
        $this->get(route('admin.no-show-reports.index'))
            ->assertRedirect(route('admin.login'));

        $this->get(route('admin.no-show-reports.show', $report->id))
            ->assertRedirect(route('admin.login'));

        $this->patch(route('admin.no-show-reports.decide', $report->id), [
            'decision' => 'valid',
            'admin_note' => 'Catatan admin untuk keputusan',
        ])->assertRedirect(route('admin.login'));

        // Student ditolak 404
        $this->actingAs($student)
            ->get(route('admin.no-show-reports.index'))
            ->assertNotFound();

        $this->actingAs($student)
            ->get(route('admin.no-show-reports.show', $report->id))
            ->assertNotFound();

        $this->actingAs($student)
            ->patch(route('admin.no-show-reports.decide', $report->id), [
                'decision' => 'valid',
                'admin_note' => 'Catatan admin untuk keputusan',
            ])->assertNotFound();

        // Mentor ditolak 404
        $this->actingAs($mentor)
            ->get(route('admin.no-show-reports.index'))
            ->assertNotFound();

        $this->actingAs($mentor)
            ->get(route('admin.no-show-reports.show', $report->id))
            ->assertNotFound();

        $this->actingAs($mentor)
            ->patch(route('admin.no-show-reports.decide', $report->id), [
                'decision' => 'valid',
                'admin_note' => 'Catatan admin untuk keputusan',
            ])->assertNotFound();
    }

    public function test_admin_list_loads_disputed_reports_by_default_with_counts(): void
    {
        $admin = $this->createAdmin();

        $this->createReportFixture('student', false, 'disanggah');
        $this->createReportFixture('mentor', false, 'disanggah');
        $this->createReportFixture('student', false, 'menunggu_respons');
        $this->createReportFixture('student', false, 'berlaku');
        $this->createReportFixture('mentor', false, 'ditolak');

        $this->actingAs($admin)
            ->get(route('admin.no-show-reports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/NoShowReport/Index', false)
                ->where('currentStatus', 'disanggah')
                ->has('reports', 2)
                ->where('counts.disanggah', 2)
                ->where('counts.menunggu_respons', 1)
                ->where('counts.berlaku', 1)
                ->where('counts.ditolak', 1)
                ->where('counts.tidak_berlaku', 0));
    }

    public function test_admin_list_can_filter_by_status(): void
    {
        $admin = $this->createAdmin();

        $this->createReportFixture('student', false, 'disanggah');
        $this->createReportFixture('student', false, 'ditolak');

        $this->actingAs($admin)
            ->get(route('admin.no-show-reports.index', ['status' => 'ditolak']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/NoShowReport/Index', false)
                ->where('currentStatus', 'ditolak')
                ->has('reports', 1)
                ->where('reports.0.status', 'ditolak'));

        $this->actingAs($admin)
            ->get(route('admin.no-show-reports.index', ['status' => 'semua']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/NoShowReport/Index', false)
                ->where('currentStatus', 'semua')
                ->has('reports', 2));
    }

    public function test_admin_can_view_report_detail(): void
    {
        $admin = $this->createAdmin();
        [, $report] = $this->createReportFixture('student', false, 'disanggah');

        $this->actingAs($admin)
            ->get(route('admin.no-show-reports.show', $report->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/NoShowReport/Show', false)
                ->where('report.id', $report->id)
                ->where('report.status', 'disanggah')
                ->where('report.reporter_note', 'Catatan bukti pelapor')
                ->where('report.response_note', 'Catatan sanggahan terlapor'));
    }

    public function test_admin_can_decide_valid_for_student_no_show_cancels_session_and_forfeits_dp(): void
    {
        Notification::fake();
        $this->travelTo('2026-10-20 12:00:00');

        $admin = $this->createAdmin();
        [$session, $report, $student, $mentor] = $this->createReportFixture('student', false, 'disanggah');

        $response = $this->actingAs($admin)
            ->patch(route('admin.no-show-reports.decide', $report->id), [
                'decision' => 'valid',
                'admin_note' => 'Student terbukti tidak hadir di room voice call sesuai bukti mentor.',
            ]);

        $response->assertRedirect(route('admin.no-show-reports.show', $report->id));
        $response->assertSessionHas('success');

        $session->refresh();
        $report->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentee', $session->cancelled_by);
        $this->assertSame('tidak_berlaku', $session->refund_status);
        $this->assertNull($session->refund_deadline);
        $this->assertSame('terverifikasi', $session->payment_dp_status);

        $this->assertSame('berlaku', $report->status);
        $this->assertSame('Student terbukti tidak hadir di room voice call sesuai bukti mentor.', $report->admin_note);
        $this->assertSame($admin->id, $report->decided_by);
        $this->assertNotNull($report->decided_at);
        $this->assertNotNull($report->finalized_at);

        Notification::assertSentTo($student, SessionEvent::class);
        Notification::assertSentTo($mentor, SessionEvent::class);
    }

    public function test_admin_can_decide_valid_for_mentor_no_show_cancels_paid_session_with_refund_waiting(): void
    {
        Notification::fake();
        $this->travelTo('2026-10-20 12:00:00');

        $admin = $this->createAdmin();
        [$session, $report, $student, $mentor] = $this->createReportFixture('mentor', false, 'disanggah');

        $response = $this->actingAs($admin)
            ->patch(route('admin.no-show-reports.decide', $report->id), [
                'decision' => 'valid',
                'admin_note' => 'Mentor terbukti absen tanpa pemberitahuan.',
            ]);

        $response->assertRedirect(route('admin.no-show-reports.show', $report->id));

        $session->refresh();
        $report->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentor', $session->cancelled_by);
        $this->assertSame('menunggu', $session->refund_status);
        $this->assertTrue($session->refund_deadline->equalTo(now()->addHours(48)));

        $this->assertSame('berlaku', $report->status);
        $this->assertSame('Mentor terbukti absen tanpa pemberitahuan.', $report->admin_note);
        $this->assertSame($admin->id, $report->decided_by);

        Notification::assertSentTo($student, SessionEvent::class);
        Notification::assertSentTo($mentor, SessionEvent::class);
    }

    public function test_admin_can_decide_valid_for_mentor_no_show_on_free_session_has_no_refund(): void
    {
        Notification::fake();
        $this->travelTo('2026-10-20 12:00:00');

        $admin = $this->createAdmin();
        [$session, $report] = $this->createReportFixture('mentor', true, 'disanggah');

        $this->actingAs($admin)
            ->patch(route('admin.no-show-reports.decide', $report->id), [
                'decision' => 'valid',
                'admin_note' => 'Mentor terbukti tidak hadir di sesi gratis.',
            ])
            ->assertRedirect(route('admin.no-show-reports.show', $report->id));

        $session->refresh();
        $report->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentor', $session->cancelled_by);
        $this->assertSame('tidak_berlaku', $session->refund_status);
        $this->assertNull($session->refund_deadline);
        $this->assertSame('berlaku', $report->status);
    }

    public function test_admin_can_decide_ditolak_does_not_change_session(): void
    {
        Notification::fake();
        $this->travelTo('2026-10-20 12:00:00');

        $admin = $this->createAdmin();
        [$session, $report, $student, $mentor] = $this->createReportFixture('student', false, 'disanggah');

        $response = $this->actingAs($admin)
            ->patch(route('admin.no-show-reports.decide', $report->id), [
                'decision' => 'ditolak',
                'admin_note' => 'Terlapor telah hadir sesuai log aktivitas obrolan Discord.',
            ]);

        $response->assertRedirect(route('admin.no-show-reports.show', $report->id));
        $response->assertSessionHas('success');

        $session->refresh();
        $report->refresh();

        // Sesi tetap dikonfirmasi (tidak diubah sama sekali)
        $this->assertSame('dikonfirmasi', $session->status);
        $this->assertNull($session->cancelled_by);
        $this->assertSame('tidak_berlaku', $session->refund_status);

        // Status laporan menjadi ditolak
        $this->assertSame('ditolak', $report->status);
        $this->assertSame('Terlapor telah hadir sesuai log aktivitas obrolan Discord.', $report->admin_note);
        $this->assertSame($admin->id, $report->decided_by);
        $this->assertNotNull($report->decided_at);

        Notification::assertSentTo($student, SessionEvent::class);
        Notification::assertSentTo($mentor, SessionEvent::class);
    }

    public function test_decision_only_allowed_for_disputed_status(): void
    {
        $admin = $this->createAdmin();

        foreach (['menunggu_respons', 'berlaku', 'ditolak'] as $nonDisputedStatus) {
            [, $report] = $this->createReportFixture('student', false, $nonDisputedStatus);

            $this->actingAs($admin)
                ->patch(route('admin.no-show-reports.decide', $report->id), [
                    'decision' => 'valid',
                    'admin_note' => 'Catatan admin untuk keputusan',
                ])
                ->assertSessionHasErrors('report');

            $this->assertSame($nonDisputedStatus, $report->refresh()->status);
        }
    }

    public function test_admin_note_is_required_with_minimum_5_characters(): void
    {
        $admin = $this->createAdmin();
        [, $report] = $this->createReportFixture('student', false, 'disanggah');

        // Tanpa catatan
        $this->actingAs($admin)
            ->patch(route('admin.no-show-reports.decide', $report->id), [
                'decision' => 'valid',
                'admin_note' => '',
            ])
            ->assertSessionHasErrors('admin_note');

        // Catatan kurang dari 5 karakter
        $this->actingAs($admin)
            ->patch(route('admin.no-show-reports.decide', $report->id), [
                'decision' => 'valid',
                'admin_note' => 'abc',
            ])
            ->assertSessionHasErrors('admin_note');

        $this->assertSame('disanggah', $report->refresh()->status);
    }

    public function test_decision_must_be_valid_or_ditolak(): void
    {
        $admin = $this->createAdmin();
        [, $report] = $this->createReportFixture('student', false, 'disanggah');

        $this->actingAs($admin)
            ->patch(route('admin.no-show-reports.decide', $report->id), [
                'decision' => 'pending_review',
                'admin_note' => 'Catatan admin yang cukup panjang.',
            ])
            ->assertSessionHasErrors('decision');

        $this->assertSame('disanggah', $report->refresh()->status);
    }

    public function test_admin_can_access_evidence_and_other_users_cannot(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('no-show-reports/bukti.png', 'isi-bukti-pelapor');
        Storage::disk('local')->put('no-show-responses/sanggah.png', 'isi-bukti-sanggahan');

        $admin = $this->createAdmin();
        $outsider = User::factory()->create();
        [, $report, $student, $mentor] = $this->createReportFixture('mentor', false, 'disanggah', [
            'evidence_path' => 'no-show-reports/bukti.png',
            'response_evidence_path' => 'no-show-responses/sanggah.png',
        ]);

        // Admin bisa mengakses bukti pelapor dan bukti tanggapan
        $adminReportResp = $this->actingAs($admin)
            ->get(route('no-show.evidence', [$report->id, 'report']))
            ->assertOk();
        $this->assertSame('isi-bukti-pelapor', $adminReportResp->streamedContent());

        $adminResponseResp = $this->actingAs($admin)
            ->get(route('no-show.evidence', [$report->id, 'response']))
            ->assertOk();
        $this->assertSame('isi-bukti-sanggahan', $adminResponseResp->streamedContent());

        // Pelapor dan terlapor tetap bisa mengakses
        $this->actingAs($student)
            ->get(route('no-show.evidence', [$report->id, 'report']))
            ->assertOk();

        $this->actingAs($mentor)
            ->get(route('no-show.evidence', [$report->id, 'response']))
            ->assertOk();

        // User lain (outsider) tetap 404
        $this->actingAs($outsider)
            ->get(route('no-show.evidence', [$report->id, 'report']))
            ->assertNotFound();

        $this->actingAs($outsider)
            ->get(route('no-show.evidence', [$report->id, 'response']))
            ->assertNotFound();
    }

    public function test_rejected_report_does_not_block_session_actions(): void
    {
        $this->travelTo('2026-10-20 10:00:00');

        [$session, , $student, $mentor] = $this->createReportFixture('student', false, 'ditolak', [], [
            'schedule_time' => now()->addDay(),
            'end_time' => now()->addDay()->addHour(),
        ]);

        // Student bisa membatalkan sesi tanpa diblokir
        $this->actingAs($student)
            ->patch(route('student.bookings.cancel-confirmed', $session->id), [
                'cancellation_reason' => 'Perlu membatalkan sesi.',
                'acknowledge_dp_forfeit' => true,
            ])
            ->assertSessionHas('success');

        $this->assertSame('dibatalkan', $session->refresh()->status);
    }

    /**
     * @param  'student'|'mentor'  $reported
     * @param  array<string, mixed>  $reportOverrides
     * @param  array<string, mixed>  $sessionOverrides
     * @return array{0: MentoringSession, 1: NoShowReport, 2: User, 3: User}
     */
    private function createReportFixture(
        string $reported,
        bool $isFree,
        string $status,
        array $reportOverrides = [],
        array $sessionOverrides = [],
    ): array {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $scheduleTime = now()->subHours(4);

        $session = MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => $isFree,
            'price_snapshot' => $isFree ? 0 : 100000,
            'payment_dp_status' => $isFree ? 'tidak_berlaku' : 'terverifikasi',
            'payment_dp_proof' => $isFree ? null : 'payment-proofs/test_dp.jpg',
            'refund_status' => 'tidak_berlaku',
        ], $sessionOverrides));

        $reportedUser = $reported === 'student' ? $student : $mentor;
        $reporter = $reported === 'student' ? $mentor : $student;

        $report = NoShowReport::query()->create(array_merge([
            'session_id' => $session->id,
            'reporter_id' => $reporter->id,
            'reported_user_id' => $reportedUser->id,
            'status' => $status,
            'reporter_note' => 'Catatan bukti pelapor',
            'evidence_path' => 'no-show-reports/bukti.png',
            'respond_deadline' => now()->addHours(12),
            'response_note' => $status === 'disanggah' ? 'Catatan sanggahan terlapor' : null,
            'response_evidence_path' => $status === 'disanggah' ? 'no-show-responses/sanggah.png' : null,
            'responded_at' => $status === 'disanggah' ? now()->subHour() : null,
        ], $reportOverrides));

        return [$session, $report, $student, $mentor];
    }
}

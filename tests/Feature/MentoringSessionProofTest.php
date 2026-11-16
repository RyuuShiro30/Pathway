<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MentoringSessionProofTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::fake('local');
    }

    private function createStudent(): User
    {
        return User::factory()->student()->create();
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->mentor()->create();

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'mentor_type' => 'paid',
            'price_per_session' => 100000,
        ]);

        return $mentor;
    }

    private function createAdmin(): User
    {
        return User::factory()->admin()->create();
    }

    private function createSessionWithProofs(User $student, User $mentor): MentoringSession
    {
        $scheduleTime = now()->addDays(2)->setTime(10, 0);

        Storage::disk('local')->put('payment-proofs/test-dp.png', 'fake-dp-content');
        Storage::disk('local')->put('payment-proofs/test-final.png', 'fake-final-content');
        Storage::disk('local')->put('refund-proofs/test-refund.pdf', 'fake-refund-content');
        Storage::disk('local')->put('session-proofs/test-session.png', 'fake-session-content');

        return MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'berlangsung',
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'terverifikasi',
            'payment_dp_proof' => 'payment-proofs/test-dp.png',
            'payment_final_status' => 'menunggu_verifikasi',
            'payment_final_proof' => 'payment-proofs/test-final.png',
            'refund_status' => 'menunggu_konfirmasi',
            'refund_proof' => 'refund-proofs/test-refund.pdf',
            'refund_proof_uploaded_at' => now(),
            'proof_file' => 'session-proofs/test-session.png',
        ]);
    }

    public function test_student_owner_can_access_dp_proof_with_200_inline_disposition_and_private_cache(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $session = $this->createSessionWithProofs($student, $mentor);

        $response = $this->actingAs($student)->get(route('session.proof', [
            'id' => $session->id,
            'type' => 'dp',
        ]));

        $response->assertOk();
        $this->assertStringContainsString('inline', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('filename=test-dp.png', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringNotContainsString('payment-proofs', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('private', (string) $response->headers->get('Cache-Control'));
    }

    public function test_student_owner_can_access_all_proof_types(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $session = $this->createSessionWithProofs($student, $mentor);

        foreach (['dp', 'final', 'refund', 'session'] as $type) {
            $response = $this->actingAs($student)->get(route('session.proof', [
                'id' => $session->id,
                'type' => $type,
            ]));

            $response->assertOk();
        }
    }

    public function test_session_mentor_can_access_all_proof_types(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $session = $this->createSessionWithProofs($student, $mentor);

        foreach (['dp', 'final', 'refund', 'session'] as $type) {
            $response = $this->actingAs($mentor)->get(route('session.proof', [
                'id' => $session->id,
                'type' => $type,
            ]));

            $response->assertOk();
        }
    }

    public function test_admin_can_access_all_proof_types(): void
    {
        $admin = $this->createAdmin();
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $session = $this->createSessionWithProofs($student, $mentor);

        foreach (['dp', 'final', 'refund', 'session'] as $type) {
            $response = $this->actingAs($admin)->get(route('session.proof', [
                'id' => $session->id,
                'type' => $type,
            ]));

            $response->assertOk();
        }
    }

    public function test_other_student_cannot_access_proof_and_receives_404(): void
    {
        $student = $this->createStudent();
        $otherStudent = $this->createStudent();
        $mentor = $this->createMentor();
        $session = $this->createSessionWithProofs($student, $mentor);

        $response = $this->actingAs($otherStudent)->get(route('session.proof', [
            'id' => $session->id,
            'type' => 'dp',
        ]));

        $response->assertNotFound();
    }

    public function test_other_mentor_cannot_access_proof_and_receives_404(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $otherMentor = $this->createMentor();
        $session = $this->createSessionWithProofs($student, $mentor);

        $response = $this->actingAs($otherMentor)->get(route('session.proof', [
            'id' => $session->id,
            'type' => 'dp',
        ]));

        $response->assertNotFound();
    }

    public function test_unrelated_user_cannot_access_proof_and_receives_404(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $unrelatedUser = User::factory()->create(['role' => 'student']);
        $session = $this->createSessionWithProofs($student, $mentor);

        $response = $this->actingAs($unrelatedUser)->get(route('session.proof', [
            'id' => $session->id,
            'type' => 'refund',
        ]));

        $response->assertNotFound();
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $session = $this->createSessionWithProofs($student, $mentor);

        $response = $this->get(route('session.proof', [
            'id' => $session->id,
            'type' => 'dp',
        ]));

        $response->assertRedirect(route('login'));
    }

    public function test_invalid_type_returns_404(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $session = $this->createSessionWithProofs($student, $mentor);

        $response = $this->actingAs($student)->get("/sessions/{$session->id}/proof/invalid-type");

        $response->assertNotFound();
    }

    public function test_non_numeric_session_id_returns_404(): void
    {
        $student = $this->createStudent();

        $response = $this->actingAs($student)->get('/sessions/abc-not-number/proof/dp');

        $response->assertNotFound();
    }

    public function test_missing_file_on_disk_returns_404(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $session = $this->createSessionWithProofs($student, $mentor);

        Storage::disk('local')->delete('payment-proofs/test-dp.png');

        $response = $this->actingAs($student)->get(route('session.proof', [
            'id' => $session->id,
            'type' => 'dp',
        ]));

        $response->assertNotFound();
    }

    public function test_frontend_props_do_not_contain_storage_and_contain_controlled_route_url(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();
        $admin = $this->createAdmin();

        $session = $this->createSessionWithProofs($student, $mentor);
        $session->update(['status' => 'diajukan']);

        // 1. MentoringSessionController@index (student bookings)
        $this->actingAs($student)
            ->get(route('student.bookings.index'))
            ->assertOk()
            ->assertInertia(function (Assert $page) use ($session) {
                $page->component('Student/MyBookings')
                    ->where('bookings.0.id', $session->id)
                    ->where('bookings.0.payment_final_proof_path', route('session.proof', ['id' => $session->id, 'type' => 'final']))
                    ->where('bookings.0.refund_proof_path', route('session.proof', ['id' => $session->id, 'type' => 'refund']));

                $bookingsJson = json_encode($page->toArray()['props']['bookings']);
                $this->assertStringNotContainsString('/storage/', $bookingsJson);
            });

        // 2. MentoringSessionController@show (mentor booking detail)
        $this->actingAs($mentor)
            ->get(route('mentor.booking.show', $session->id))
            ->assertOk()
            ->assertInertia(function (Assert $page) use ($session) {
                $page->component('Mentor/BookingRequestDetail')
                    ->where('session.id', $session->id)
                    ->where('session.payment_dp_proof', route('session.proof', ['id' => $session->id, 'type' => 'dp']));

                $sessionProp = $page->toArray()['props']['session'];
                $this->assertStringNotContainsString('/storage/', (string) $sessionProp['payment_dp_proof']);
            });

        // 3. MentorProfileController@dashboard (mentor dashboard booking requests)
        $this->actingAs($mentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(function (Assert $page) use ($session) {
                $page->component('Mentor/Dashboard')
                    ->where('bookingRequests.0.id', $session->id)
                    ->where('bookingRequests.0.payment_dp_proof', route('session.proof', ['id' => $session->id, 'type' => 'dp']));

                $bookingRequestsJson = json_encode($page->toArray()['props']['bookingRequests']);
                $this->assertStringNotContainsString('/storage/', $bookingRequestsJson);
            });

        // 4. MentoringSessionController@tracking (mentor session tracking)
        $session->update(['status' => 'berlangsung']);
        $this->actingAs($mentor)
            ->get(route('mentor.session.tracking', $session->id))
            ->assertOk()
            ->assertInertia(function (Assert $page) use ($session) {
                $page->component('Mentor/SessionTracking')
                    ->where('session.id', $session->id)
                    ->where('session.payment_final_proof', route('session.proof', ['id' => $session->id, 'type' => 'final']))
                    ->where('session.proof_file', route('session.proof', ['id' => $session->id, 'type' => 'session']));

                $sessionProp = $page->toArray()['props']['session'];
                $this->assertStringNotContainsString('/storage/', (string) $sessionProp['payment_final_proof']);
                $this->assertStringNotContainsString('/storage/', (string) $sessionProp['proof_file']);
            });

        // 5. MentoringSessionController@refundForm (mentor refund process)
        $session->update([
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(24),
        ]);
        $this->actingAs($mentor)
            ->get(route('mentor.refund.form', $session->id))
            ->assertOk()
            ->assertInertia(function (Assert $page) use ($session) {
                $page->component('Mentor/RefundProcess')
                    ->where('session.id', $session->id)
                    ->where('session.payment_dp_proof', route('session.proof', ['id' => $session->id, 'type' => 'dp']));

                $sessionProp = $page->toArray()['props']['session'];
                $this->assertStringNotContainsString('/storage/', (string) $sessionProp['payment_dp_proof']);
            });

        // 6. AdminRefundReportController@show (admin refund report)
        $this->actingAs($admin)
            ->get(route('admin.refund-reports.show', $session->id))
            ->assertOk()
            ->assertInertia(function (Assert $page) use ($session) {
                $page->component('Admin/RefundReport/Show')
                    ->where('report.id', $session->id)
                    ->where('report.payment_dp_proof', route('session.proof', ['id' => $session->id, 'type' => 'dp']))
                    ->where('report.refund_proof', route('session.proof', ['id' => $session->id, 'type' => 'refund']));

                $reportProp = $page->toArray()['props']['report'];
                $this->assertStringNotContainsString('/storage/', (string) $reportProp['payment_dp_proof']);
                $this->assertStringNotContainsString('/storage/', (string) $reportProp['refund_proof']);
            });
    }

    public function test_command_dry_run_does_not_modify_anything(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        Storage::disk('public')->put('payment-proofs/legacy-dp.png', 'legacy-content');

        MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => now()->addDays(1),
            'end_time' => now()->addDays(1)->addHour(),
            'duration_hours' => 1,
            'payment_dp_proof' => 'payment-proofs/legacy-dp.png',
        ]);

        $this->artisan('proofs:migrate-to-private', ['--dry-run' => true])
            ->expectsOutputToContain('[DRY-RUN]')
            ->expectsOutput('Dipindah: 1')
            ->expectsOutput('Dilewati: 0')
            ->expectsOutput('Hilang: 0')
            ->assertSuccessful();

        $this->assertFalse(Storage::disk('local')->exists('payment-proofs/legacy-dp.png'));
        $this->assertTrue(Storage::disk('public')->exists('payment-proofs/legacy-dp.png'));
    }

    public function test_command_copies_file_without_deleting_source_by_default(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        Storage::disk('public')->put('payment-proofs/legacy-dp.png', 'legacy-content');

        MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => now()->addDays(1),
            'end_time' => now()->addDays(1)->addHour(),
            'duration_hours' => 1,
            'payment_dp_proof' => 'payment-proofs/legacy-dp.png',
        ]);

        $this->artisan('proofs:migrate-to-private')
            ->expectsOutput('Dipindah: 1')
            ->expectsOutput('Dilewati: 0')
            ->expectsOutput('Hilang: 0')
            ->assertSuccessful();

        $this->assertTrue(Storage::disk('local')->exists('payment-proofs/legacy-dp.png'));
        $this->assertTrue(Storage::disk('public')->exists('payment-proofs/legacy-dp.png'));
        $this->assertSame('legacy-content', Storage::disk('local')->get('payment-proofs/legacy-dp.png'));
    }

    public function test_command_is_idempotent_and_skips_already_migrated_files(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        Storage::disk('public')->put('payment-proofs/legacy-dp.png', 'legacy-content');
        Storage::disk('local')->put('payment-proofs/legacy-dp.png', 'legacy-content');

        MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => now()->addDays(1),
            'end_time' => now()->addDays(1)->addHour(),
            'duration_hours' => 1,
            'payment_dp_proof' => 'payment-proofs/legacy-dp.png',
        ]);

        $this->artisan('proofs:migrate-to-private')
            ->expectsOutput('Dipindah: 0')
            ->expectsOutput('Dilewati: 1')
            ->expectsOutput('Hilang: 0')
            ->assertSuccessful();

        $this->assertTrue(Storage::disk('local')->exists('payment-proofs/legacy-dp.png'));
    }

    public function test_command_reports_missing_files_when_not_found_on_public_or_local(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => now()->addDays(1),
            'end_time' => now()->addDays(1)->addHour(),
            'duration_hours' => 1,
            'payment_dp_proof' => 'payment-proofs/non-existent.png',
        ]);

        $this->artisan('proofs:migrate-to-private')
            ->expectsOutput('Dipindah: 0')
            ->expectsOutput('Dilewati: 0')
            ->expectsOutput('Hilang: 1')
            ->assertSuccessful();
    }

    public function test_command_delete_source_option_removes_source_from_public(): void
    {
        $student = $this->createStudent();
        $mentor = $this->createMentor();

        Storage::disk('public')->put('payment-proofs/to-delete.png', 'delete-me');

        MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => now()->addDays(1),
            'end_time' => now()->addDays(1)->addHour(),
            'duration_hours' => 1,
            'payment_dp_proof' => 'payment-proofs/to-delete.png',
        ]);

        $this->artisan('proofs:migrate-to-private', ['--delete-source' => true])
            ->expectsOutput('Dipindah: 1')
            ->assertSuccessful();

        $this->assertTrue(Storage::disk('local')->exists('payment-proofs/to-delete.png'));
        $this->assertFalse(Storage::disk('public')->exists('payment-proofs/to-delete.png'));
    }
}

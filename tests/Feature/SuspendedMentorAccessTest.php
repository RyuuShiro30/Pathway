<?php

namespace Tests\Feature;

use App\Models\BadgeInventory;
use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\MerchandiseInventory;
use App\Models\NoShowReport;
use App\Models\PointTransaction;
use App\Models\User;
use App\Services\MentorSuspensionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class SuspendedMentorAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_suspended_mentor_does_not_appear_in_public_directory(): void
    {
        $activeMentor = $this->createMentor(['name' => 'Active Mentor']);
        $suspendedMentor = $this->createMentor(['name' => 'Suspended Mentor'], isSuspended: true);

        $response = $this->get(route('mentors.index'));

        $response->assertOk();
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Mentors/Index')
            ->has('mentors', 1)
            ->where('mentors.0.user.id', $activeMentor->id)
        );
    }

    public function test_mentee_cannot_open_booking_page_of_suspended_mentor(): void
    {
        $mentee = User::factory()->create();
        $suspendedMentor = $this->createMentor(isSuspended: true);

        $this->actingAs($mentee)
            ->get(route('student.booking.schedule', $suspendedMentor->id))
            ->assertNotFound();
    }

    public function test_mentee_can_open_booking_page_of_active_mentor(): void
    {
        $mentee = User::factory()->create();
        $activeMentor = $this->createMentor(isSuspended: false);

        $this->actingAs($mentee)
            ->get(route('student.booking.schedule', $activeMentor->id))
            ->assertOk();
    }

    public function test_suspended_mentor_cannot_update_availability(): void
    {
        $suspendedMentor = $this->createMentor(isSuspended: true);

        $this->actingAs($suspendedMentor)
            ->patch(route('mentor.availability.update'), [
                'availability_schedule' => [
                    [
                        'day' => 'senin',
                        'start' => '09:00',
                        'end' => '10:00',
                        'type' => 'gratis',
                    ],
                ],
            ])
            ->assertForbidden();
    }

    public function test_active_mentor_can_update_availability(): void
    {
        $activeMentor = $this->createMentor(isSuspended: false);

        $this->actingAs($activeMentor)
            ->patch(route('mentor.availability.update'), [
                'availability_schedule' => [
                    [
                        'day' => 'senin',
                        'start' => '09:00',
                        'end' => '10:00',
                        'type' => 'gratis',
                    ],
                ],
            ])
            ->assertSessionHas('success');
    }

    public function test_suspended_mentor_cannot_accept_new_booking(): void
    {
        $suspendedMentor = $this->createMentor(isSuspended: true);
        $session = $this->createBookingSession($suspendedMentor, 'diajukan');

        $this->actingAs($suspendedMentor)
            ->patch(route('mentor.booking.respond', $session->id), ['action' => 'terima'])
            ->assertSessionHasErrors('message');

        $this->assertSame('diajukan', $session->refresh()->status);
    }

    public function test_suspended_mentor_cannot_redeem_badge(): void
    {
        $suspendedMentor = $this->createMentor(isSuspended: true);
        $badge = BadgeInventory::query()->create([
            'name' => 'Top Mentor',
            'description' => 'Badge top mentor',
            'point_cost' => 50,
        ]);
        $this->givePoints($suspendedMentor, 100);

        $this->actingAs($suspendedMentor)
            ->post(route('mentor.badges.redeem', $badge->id))
            ->assertForbidden();
    }

    public function test_active_mentor_can_redeem_badge(): void
    {
        $activeMentor = $this->createMentor(isSuspended: false);
        $badge = BadgeInventory::query()->create([
            'name' => 'Top Mentor',
            'description' => 'Badge top mentor',
            'point_cost' => 50,
        ]);
        $this->givePoints($activeMentor, 100);

        $this->actingAs($activeMentor)
            ->post(route('mentor.badges.redeem', $badge->id))
            ->assertRedirect();
    }

    public function test_suspended_mentor_cannot_redeem_merchandise(): void
    {
        $suspendedMentor = $this->createMentor(isSuspended: true);
        $item = MerchandiseInventory::query()->create([
            'name' => 'Kaos Pathway',
            'description' => 'Merch Pathway',
            'point_cost' => 50,
            'stock' => 10,
        ]);
        $this->givePoints($suspendedMentor, 100);

        $this->actingAs($suspendedMentor)
            ->post(route('mentor.merchandise.redeem', $item->id), [
                'quantity' => 1,
                'recipient_name' => 'Mentor Budi',
                'phone_number' => '08123456789',
                'shipping_address' => 'Jl. Merdeka No. 1',
            ])
            ->assertForbidden();
    }

    public function test_suspended_mentor_can_still_open_dashboard_with_suspension_flag(): void
    {
        $suspendedMentor = $this->createMentor(isSuspended: true);

        $this->actingAs($suspendedMentor)
            ->get(route('mentor.dashboard'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Mentor/Dashboard')
                ->where('mentorProfile.is_suspended', true)
            );
    }

    public function test_suspended_mentor_can_still_process_refund(): void
    {
        Storage::fake('public');
        $suspendedMentor = $this->createMentor(isSuspended: true);
        $student = User::factory()->create();

        $session = MentoringSession::query()->create([
            'mentor_id' => $suspendedMentor->id,
            'student_id' => $student->id,
            'status' => 'dibatalkan',
            'cancelled_by' => 'mentor',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'terverifikasi',
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(24),
            'schedule_time' => now()->addDays(2),
            'end_time' => now()->addDays(2)->addHour(),
            'duration_hours' => 1,
        ]);

        $this->actingAs($suspendedMentor)
            ->patch(route('mentor.refund.complete', $session->id), [
                'refund_proof' => UploadedFile::fake()->create('refund.jpg', 500, 'image/jpeg'),
            ])
            ->assertRedirect(route('mentor.dashboard'))
            ->assertSessionHas('success');

        $session->refresh();
        $this->assertSame('menunggu_konfirmasi', $session->refund_status);
        $this->assertNotNull($session->refund_proof);
    }

    public function test_suspended_mentor_can_still_complete_ongoing_session(): void
    {
        Storage::fake('public');
        $suspendedMentor = $this->createMentor(isSuspended: true);
        $student = User::factory()->create();

        $session = MentoringSession::query()->create([
            'mentor_id' => $suspendedMentor->id,
            'student_id' => $student->id,
            'status' => 'berlangsung',
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
            'schedule_time' => now()->subHour(),
            'end_time' => now(),
            'duration_hours' => 1,
        ]);

        $this->actingAs($suspendedMentor)
            ->patch(route('mentor.session.complete', $session->id), [
                'proof_file' => UploadedFile::fake()->image('bukti.jpg'),
                'notes_from_mentor' => 'Sesi selesai dengan baik.',
            ])
            ->assertRedirect(route('mentor.dashboard'))
            ->assertSessionHas('success');

        $this->assertSame('selesai', $session->refresh()->status);
    }

    public function test_suspended_mentor_can_still_cancel_confirmed_session(): void
    {
        $suspendedMentor = $this->createMentor(isSuspended: true);
        $student = User::factory()->create();

        $session = MentoringSession::query()->create([
            'mentor_id' => $suspendedMentor->id,
            'student_id' => $student->id,
            'status' => 'dikonfirmasi',
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
            'schedule_time' => now()->addDays(2),
            'end_time' => now()->addDays(2)->addHour(),
            'duration_hours' => 1,
        ]);

        $this->actingAs($suspendedMentor)
            ->patch(route('mentor.session.cancel', $session->id), [
                'cancellation_reason' => 'Ada keperluan mendadak.',
            ])
            ->assertRedirect(route('mentor.dashboard'))
            ->assertSessionHas('success');

        $session->refresh();
        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('mentor', $session->cancelled_by);
    }

    public function test_suspended_mentor_can_still_respond_to_no_show_report(): void
    {
        $this->travelTo('2026-10-20 12:00:00');
        $suspendedMentor = $this->createMentor(isSuspended: true);
        $student = User::factory()->create();

        $session = MentoringSession::query()->create([
            'mentor_id' => $suspendedMentor->id,
            'student_id' => $student->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => Carbon::parse('2026-10-20 10:00:00'),
            'end_time' => Carbon::parse('2026-10-20 11:00:00'),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);

        $report = NoShowReport::query()->create([
            'session_id' => $session->id,
            'reporter_id' => $student->id,
            'reported_user_id' => $suspendedMentor->id,
            'status' => 'menunggu_respons',
            'reporter_note' => 'Mentor tidak hadir',
            'evidence_path' => 'no-show-reports/test.jpg',
            'respond_deadline' => Carbon::parse('2026-10-21 12:00:00'),
        ]);

        $this->actingAs($suspendedMentor)
            ->patch(route('no-show.respond', $report->id), [
                'response_note' => 'Saya hadir tepat waktu di Discord.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $report->refresh();
        $this->assertSame('disanggah', $report->status);
        $this->assertSame('Saya hadir tepat waktu di Discord.', $report->response_note);
    }

    public function test_is_suspended_mentor_helper_works_correctly(): void
    {
        $activeMentor = $this->createMentor(isSuspended: false);
        $suspendedMentor = $this->createMentor(isSuspended: true);
        $regularStudent = User::factory()->create();

        $this->assertFalse($activeMentor->isSuspendedMentor());
        $this->assertTrue($suspendedMentor->isSuspendedMentor());
        $this->assertFalse($regularStudent->isSuspendedMentor());

        // Langsung cek flag is_suspended pada profil tanpa suspension log
        $flaggedMentor = User::factory()->mentor()->create();
        MentorProfile::query()->create([
            'user_id' => $flaggedMentor->id,
            'expertise' => 'Design',
            'verification_status' => 'verified',
            'is_suspended' => true,
        ]);
        $this->assertTrue($flaggedMentor->isSuspendedMentor());
    }

    private function createMentor(array $userAttributes = [], bool $isSuspended = false): User
    {
        $mentor = User::factory()->mentor()->create($userAttributes);

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
            'verification_status' => 'verified',
            'is_available' => true,
            'is_suspended' => false,
        ]);

        if ($isSuspended) {
            app(MentorSuspensionService::class)->suspend(
                $mentor->id,
                'refund_terlambat',
            );
            $mentor->refresh();
        }

        return $mentor;
    }

    private function createBookingSession(User $mentor, string $status): MentoringSession
    {
        $student = User::factory()->create();
        $scheduleTime = now()->addDays(3)->setTime(9, 0);

        return MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => $status,
            'schedule_time' => $scheduleTime,
            'end_time' => $scheduleTime->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'refund_status' => 'tidak_berlaku',
        ]);
    }

    private function givePoints(User $user, int $amount): void
    {
        PointTransaction::query()->create([
            'user_id' => $user->id,
            'amount' => $amount,
            'transaction_type' => 'admin_bonus',
            'description' => 'Test points',
        ]);
    }
}

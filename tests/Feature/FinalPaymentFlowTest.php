<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use App\Notifications\SessionEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FinalPaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Storage::fake('local');
    }

    public function test_other_student_cannot_upload_proof_to_another_students_session_returns_404(): void
    {
        Storage::fake('public');

        $student = User::factory()->create();
        $otherStudent = User::factory()->create();
        $mentor = $this->createMentor();
        $session = $this->createSession($student, $mentor, 'berlangsung', false, 'belum_dibayar');

        $file = UploadedFile::fake()->image('pelunasan.jpg');

        $response = $this->actingAs($otherStudent)->post(
            route('student.bookings.payment-final.upload', $session->id),
            ['payment_final_proof' => $file]
        );

        $response->assertNotFound();
        $this->assertNull($session->fresh()->payment_final_proof);
        $this->assertSame('belum_dibayar', $session->fresh()->payment_final_status);
    }

    public function test_upload_proof_rejected_for_free_session(): void
    {
        Storage::fake('public');

        $student = User::factory()->create();
        $mentor = $this->createMentor();
        $session = $this->createSession($student, $mentor, 'berlangsung', true, 'tidak_berlaku');

        $file = UploadedFile::fake()->image('pelunasan.jpg');

        $response = $this->actingAs($student)->post(
            route('student.bookings.payment-final.upload', $session->id),
            ['payment_final_proof' => $file]
        );

        $response->assertForbidden();
    }

    public function test_upload_proof_rejected_for_invalid_session_status(): void
    {
        Storage::fake('public');

        $student = User::factory()->create();
        $mentor = $this->createMentor();

        // Status diajukan
        $sessionPending = $this->createSession($student, $mentor, 'diajukan', false, 'belum_dibayar');

        $response = $this->actingAs($student)->post(
            route('student.bookings.payment-final.upload', $sessionPending->id),
            ['payment_final_proof' => UploadedFile::fake()->image('pelunasan.jpg')]
        );

        $response->assertForbidden();

        // Status dibatalkan
        $sessionCancelled = $this->createSession($student, $mentor, 'dibatalkan', false, 'belum_dibayar');

        $response = $this->actingAs($student)->post(
            route('student.bookings.payment-final.upload', $sessionCancelled->id),
            ['payment_final_proof' => UploadedFile::fake()->image('pelunasan.jpg')]
        );

        $response->assertForbidden();
    }

    public function test_upload_proof_rejected_if_payment_final_status_is_already_menunggu_verifikasi_or_terverifikasi(): void
    {
        Storage::fake('public');

        $student = User::factory()->create();
        $mentor = $this->createMentor();

        // Status menunggu_verifikasi
        $sessionWaiting = $this->createSession($student, $mentor, 'selesai', false, 'menunggu_verifikasi');

        $response = $this->actingAs($student)->post(
            route('student.bookings.payment-final.upload', $sessionWaiting->id),
            ['payment_final_proof' => UploadedFile::fake()->image('pelunasan.jpg')]
        );

        $response->assertForbidden();

        // Status terverifikasi
        $sessionVerified = $this->createSession($student, $mentor, 'selesai', false, 'terverifikasi');

        $response = $this->actingAs($student)->post(
            route('student.bookings.payment-final.upload', $sessionVerified->id),
            ['payment_final_proof' => UploadedFile::fake()->image('pelunasan.jpg')]
        );

        $response->assertForbidden();
    }

    public function test_student_can_upload_valid_image_or_pdf_proof_and_mentor_is_notified(): void
    {
        Storage::fake('public');
        Notification::fake();

        $student = User::factory()->create();
        $mentor = $this->createMentor();
        $session = $this->createSession($student, $mentor, 'berlangsung', false, 'belum_dibayar');

        $file = UploadedFile::fake()->create('pelunasan.pdf', 500, 'application/pdf');

        $response = $this->actingAs($student)->post(
            route('student.bookings.payment-final.upload', $session->id),
            ['payment_final_proof' => $file]
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $fresh = $session->fresh();
        $this->assertSame('menunggu_verifikasi', $fresh->payment_final_status);
        $this->assertNotNull($fresh->payment_final_proof);
        Storage::disk('local')->assertExists($fresh->payment_final_proof);

        Notification::assertSentTo(
            $mentor,
            SessionEvent::class,
            function (SessionEvent $notification) {
                return str_contains($notification->toArray(new \stdClass)['message'], 'pelunasan');
            }
        );
    }

    public function test_student_upload_proof_validates_file_size_and_mimes(): void
    {
        Storage::fake('public');

        $student = User::factory()->create();
        $mentor = $this->createMentor();
        $session = $this->createSession($student, $mentor, 'selesai', false, 'belum_dibayar');

        // File too large (> 2MB)
        $largeFile = UploadedFile::fake()->create('large.jpg', 3000, 'image/jpeg');

        $response = $this->actingAs($student)->post(
            route('student.bookings.payment-final.upload', $session->id),
            ['payment_final_proof' => $largeFile]
        );

        $response->assertSessionHasErrors('payment_final_proof');

        // Invalid mime (text)
        $txtFile = UploadedFile::fake()->create('proof.txt', 10, 'text/plain');

        $response = $this->actingAs($student)->post(
            route('student.bookings.payment-final.upload', $session->id),
            ['payment_final_proof' => $txtFile]
        );

        $response->assertSessionHasErrors('payment_final_proof');
    }

    public function test_student_can_reupload_proof_when_previous_proof_was_rejected(): void
    {
        Storage::fake('public');

        $student = User::factory()->create();
        $mentor = $this->createMentor();
        $session = $this->createSession($student, $mentor, 'selesai', false, 'ditolak', [
            'payment_final_proof' => 'payment-proofs/old-rejected.png',
        ]);

        $file = UploadedFile::fake()->image('new-pelunasan.png');

        $response = $this->actingAs($student)->post(
            route('student.bookings.payment-final.upload', $session->id),
            ['payment_final_proof' => $file]
        );

        $response->assertRedirect();
        $fresh = $session->fresh();
        $this->assertSame('menunggu_verifikasi', $fresh->payment_final_status);
        $this->assertNotSame('payment-proofs/old-rejected.png', $fresh->payment_final_proof);
    }

    public function test_other_mentor_cannot_verify_final_payment(): void
    {
        $student = User::factory()->create();
        $mentor = $this->createMentor();
        $otherMentor = $this->createMentor();

        $session = $this->createSession($student, $mentor, 'selesai', false, 'menunggu_verifikasi', [
            'payment_final_proof' => 'payment-proofs/proof.png',
        ]);

        $response = $this->actingAs($otherMentor)->patch(
            route('mentor.session.payment-final.verify', $session->id),
            ['action' => 'terima']
        );

        $response->assertNotFound();
        $this->assertSame('menunggu_verifikasi', $session->fresh()->payment_final_status);
    }

    public function test_mentor_can_accept_final_payment_and_student_is_notified(): void
    {
        Notification::fake();

        $student = User::factory()->create();
        $mentor = $this->createMentor();
        $session = $this->createSession($student, $mentor, 'selesai', false, 'menunggu_verifikasi', [
            'payment_final_proof' => 'payment-proofs/proof.png',
        ]);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.payment-final.verify', $session->id),
            ['action' => 'terima']
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSame('terverifikasi', $session->fresh()->payment_final_status);

        Notification::assertSentTo(
            $student,
            SessionEvent::class,
            function (SessionEvent $notification) {
                return str_contains($notification->toArray(new \stdClass)['message'], 'pelunasan');
            }
        );
    }

    public function test_mentor_can_reject_final_payment_with_reason_and_student_is_notified(): void
    {
        Notification::fake();

        $student = User::factory()->create();
        $mentor = $this->createMentor();
        $session = $this->createSession($student, $mentor, 'selesai', false, 'menunggu_verifikasi', [
            'payment_final_proof' => 'payment-proofs/proof.png',
        ]);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.payment-final.verify', $session->id),
            [
                'action' => 'tolak',
                'rejection_reason' => 'Bukti buram dan tidak menampilkan nomor transaksi.',
            ]
        );

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSame('ditolak', $session->fresh()->payment_final_status);

        Notification::assertSentTo(
            $student,
            SessionEvent::class,
            function (SessionEvent $notification) {
                $payload = $notification->toArray(new \stdClass);

                return str_contains($payload['message'], 'ditolak')
                    && str_contains($payload['message'], 'Bukti buram');
            }
        );
    }

    public function test_mentor_cannot_reject_final_payment_without_reason(): void
    {
        $student = User::factory()->create();
        $mentor = $this->createMentor();
        $session = $this->createSession($student, $mentor, 'selesai', false, 'menunggu_verifikasi', [
            'payment_final_proof' => 'payment-proofs/proof.png',
        ]);

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.payment-final.verify', $session->id),
            ['action' => 'tolak', 'rejection_reason' => '']
        );

        $response->assertSessionHasErrors('rejection_reason');
        $this->assertSame('menunggu_verifikasi', $session->fresh()->payment_final_status);
    }

    public function test_mentor_cannot_verify_if_payment_final_status_is_not_menunggu_verifikasi(): void
    {
        $student = User::factory()->create();
        $mentor = $this->createMentor();

        // status belum_dibayar
        $sessionUnpaid = $this->createSession($student, $mentor, 'selesai', false, 'belum_dibayar');

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.payment-final.verify', $sessionUnpaid->id),
            ['action' => 'terima']
        );

        $response->assertForbidden();

        // status terverifikasi
        $sessionVerified = $this->createSession($student, $mentor, 'selesai', false, 'terverifikasi');

        $response = $this->actingAs($mentor)->patch(
            route('mentor.session.payment-final.verify', $sessionVerified->id),
            ['action' => 'terima']
        );

        $response->assertForbidden();
    }

    private function createMentor(): User
    {
        $mentor = User::factory()->mentor()->create([
            'bank_name' => 'BCA',
            'bank_account_number' => '1234567890',
            'bank_account_holder' => 'Budi Mentor',
        ]);

        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'discord_room_link' => 'https://discord.gg/mentor-room',
        ]);

        return $mentor;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createSession(
        User $student,
        User $mentor,
        string $status,
        bool $isFreeSession,
        string $paymentFinalStatus,
        array $overrides = []
    ): MentoringSession {
        $start = now()->subHour();

        return MentoringSession::query()->create(array_merge([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => $status,
            'schedule_time' => $start,
            'end_time' => $start->copy()->addHour(),
            'duration_hours' => 1,
            'is_free_session' => $isFreeSession,
            'price_snapshot' => $isFreeSession ? 0 : 100000,
            'payment_dp_status' => $isFreeSession ? 'tidak_berlaku' : 'terverifikasi',
            'payment_final_status' => $paymentFinalStatus,
            'refund_status' => 'tidak_berlaku',
        ], $overrides));
    }
}

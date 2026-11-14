<?php

namespace Tests\Feature;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\RescheduleRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RefundRescheduleOfferTest extends TestCase
{
    use RefreshDatabase;

    // Test 1 untuk memastikan mentor dapat menawarkan jadwal pengganti untuk sesi berbayar yang dibatalkan.
    public function test_mentor_can_offer_replacement_schedule_for_cancelled_paid_session(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian.
        $now = Carbon::parse('2026-11-14 08:00:00', 'Asia/Jakarta');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor dengan jadwal tersedia.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '11:00',
                    'type' => 'berbayar',
                    'price' => 50000,
                ],
            ],
        ]);

        // Buat sesi berbayar yang dibatalkan mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'Asia/Jakarta'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(36),
        ]);

        // Mentor menawarkan jadwal pengganti.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 09:00:00',
                'reason' => 'Menawarkan jadwal pengganti.',
            ]);

        // Pastikan permintaan berhasil.
        $response->assertRedirect('/mentor/dashboard');
        $response->assertSessionHasNoErrors();

        // Pastikan penawaran tersimpan.
        $this->assertDatabaseHas('mentoring_reschedule_requests', [
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'status' => 'menunggu_respons',
            'reason' => 'Menawarkan jadwal pengganti.',
        ]);

        // Periksa detail penawaran.
        $offer = RescheduleRequest::query()
            ->where('session_id', $session->id)
            ->firstOrFail();

        $this->assertEquals(
            '2026-11-16 02:00:00',
            $offer->new_schedule_time->format('Y-m-d H:i:s')
        );

        $this->assertTrue(
            $offer->respond_deadline->equalTo($now->copy()->addHours(24))
        );

        $this->assertNotNull($offer->refund_paused_at);

        // Pastikan sesi lama tetap dibatalkan dan refund masih menunggu.
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'refund_status' => 'menunggu',
            'cancelled_by' => 'mentor',
        ]);
    }

    // Test 2 untuk memastikan mentee dapat menolak penawaran jadwal pengganti dari mentor.
    public function test_student_can_reject_paid_refund_reschedule_offer(): void
    {
        // Bekukan waktu pengujian.
        $now = Carbon::parse('2026-11-14 08:00:00', 'Asia/Jakarta');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat sesi berbayar yang dibatalkan mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'Asia/Jakarta'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addHours(36),
        ]);

        // Buat penawaran jadwal pengganti dari mentor.
        $offer = RescheduleRequest::query()->create([
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'old_schedule_time' => $session->schedule_time,
            'old_end_time' => $session->end_time,
            'new_schedule_time' => Carbon::parse('2026-11-16 09:00:00', 'Asia/Jakarta'),
            'new_end_time' => Carbon::parse('2026-11-16 10:00:00', 'Asia/Jakarta'),
            'status' => 'menunggu_respons',
            'reason' => 'Menawarkan jadwal pengganti.',
            'respond_deadline' => $now->copy()->addHours(24),
            'refund_paused_at' => $now,
        ]);

        // Mentee menolak penawaran.
        $response = $this->actingAs($student)
            ->patch(route('student.bookings.refund-reschedule.respond', [
                'id' => $session->id,
            ]), [
                'action' => 'tolak',
            ]);

        $offer->refresh();

        // Pastikan respons berhasil.
        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasNoErrors();

        // Pastikan penawaran berubah menjadi ditolak.
        $this->assertDatabaseHas('mentoring_reschedule_requests', [
            'id' => $offer->id,
            'status' => 'ditolak',
        ]);

        // Pastikan sesi tetap dibatalkan dan refund kembali menunggu.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('menunggu', $session->refund_status);

        // Pastikan batas waktu refund dimulai kembali 48 jam.
        $this->assertTrue(
            $session->refund_deadline->equalTo($now->copy()->addHours(48))
        );
    }

    // test 3 menguji mentee dapat menerima penawaran jadwal pengganti sehingga sesi dikonfirmasi kembali.
    public function test_student_can_accept_paid_refund_reschedule_offer(): void
    {
        // Bekukan waktu pengujian.
        $now = Carbon::parse('2026-11-14 08:00:00', 'Asia/Jakarta');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat sesi berbayar yang dibatalkan mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'Asia/Jakarta'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addHours(36),
        ]);

        // Buat penawaran jadwal pengganti dari mentor.
        $offer = RescheduleRequest::query()->create([
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'old_schedule_time' => $session->schedule_time,
            'old_end_time' => $session->end_time,
            'new_schedule_time' => Carbon::parse('2026-11-16 09:00:00', 'Asia/Jakarta')->utc(),
            'new_end_time' => Carbon::parse('2026-11-16 10:00:00', 'Asia/Jakarta')->utc(),
            'status' => 'menunggu_respons',
            'reason' => 'Menawarkan jadwal pengganti.',
            'respond_deadline' => $now->copy()->addHours(24),
            'refund_paused_at' => $now,
        ]);

        // Mentee menerima penawaran.
        $response = $this->actingAs($student)
            ->patch(route('student.bookings.refund-reschedule.respond', [
                'id' => $session->id,
            ]), [
                'action' => 'terima',
            ]);

        // Pastikan respons berhasil.
        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasNoErrors();

        // Pastikan penawaran berubah menjadi diterima.
        $this->assertDatabaseHas('mentoring_reschedule_requests', [
            'id' => $offer->id,
            'status' => 'diterima',
        ]);

        // Periksa perubahan status dan jadwal sesi.
        $session->refresh();

        $this->assertTrue(
            $session->schedule_time->equalTo(
                Carbon::parse('2026-11-16 09:00:00', 'Asia/Jakarta')->utc()
            )
        );

        // Pastikan proses refund dibatalkan.
        $this->assertSame('tidak_berlaku', $session->refund_status);
        $this->assertNull($session->refund_deadline);
        $this->assertNull($session->cancelled_by);
        $this->assertNull($session->cancellation_reason);
    }

    // test 4 menguji penawaran jadwal pengganti yang kedaluwarsa setelah 24 jam dan mengaktifkan kembali batas waktu refund 48 jam.
    public function test_paid_refund_reschedule_offer_expires_after_24_hours(): void
    {
        // Bekukan waktu setelah batas respons 24 jam terlewati.
        $now = Carbon::parse('2026-11-15 09:00:00', 'Asia/Jakarta');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat sesi berbayar yang dibatalkan mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta')->utc(),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'Asia/Jakarta')->utc(),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => Carbon::parse('2026-11-16 08:00:00', 'Asia/Jakarta'),
        ]);

        // Buat penawaran jadwal pengganti yang sudah melewati batas respons.
        $offer = RescheduleRequest::query()->create([
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'old_schedule_time' => $session->schedule_time,
            'old_end_time' => $session->end_time,
            'new_schedule_time' => Carbon::parse('2026-11-16 09:00:00', 'Asia/Jakarta')->utc(),
            'new_end_time' => Carbon::parse('2026-11-16 10:00:00', 'Asia/Jakarta')->utc(),
            'status' => 'menunggu_respons',
            'reason' => 'Menawarkan jadwal pengganti.',
            'respond_deadline' => now()->subHour(),
            'refund_paused_at' => now()->subHours(25),
        ]);

        // Mentee mencoba memberikan respons setelah batas waktu terlewati.
        $response = $this->actingAs($student)
            ->patch(route('student.bookings.refund-reschedule.respond', [
                'id' => $session->id,
            ]), [
                'action' => 'terima',
            ]);

        // Pastikan sistem memberikan pesan bahwa penawaran sudah kedaluwarsa.
        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasErrors();

        // Pastikan status penawaran berubah menjadi kedaluwarsa.
        $this->assertDatabaseHas('mentoring_reschedule_requests', [
            'id' => $offer->id,
            'status' => 'kedaluwarsa',
        ]);

        // Pastikan sesi tetap dibatalkan dan refund kembali menunggu.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('menunggu', $session->refund_status);

        // Pastikan batas waktu refund dimulai kembali 48 jam.
        $this->assertTrue(
            $session->refund_deadline->equalTo($now->copy()->addHours(48))
        );
    }

    // test 5 menguji mentor tidak dapat memberikan penawaran jadwal pengganti lebih dari satu kali untuk sesi yang sama.
    public function test_mentor_cannot_make_second_refund_reschedule_offer_for_same_session(): void
    {
        // Bekukan waktu pengujian.
        $now = Carbon::parse('2026-11-14 08:00:00', 'Asia/Jakarta');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor dengan jadwal tersedia.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '11:00',
                    'type' => 'berbayar',
                    'price' => 50000,
                ],
            ],
        ]);

        // Buat sesi berbayar yang dibatalkan mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta')->utc(),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'Asia/Jakarta')->utc(),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addHours(36),
        ]);

        // Buat penawaran pertama yang sudah ditolak oleh mentee.
        RescheduleRequest::query()->create([
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'old_schedule_time' => $session->schedule_time,
            'old_end_time' => $session->end_time,
            'new_schedule_time' => Carbon::parse('2026-11-16 09:00:00', 'Asia/Jakarta')->utc(),
            'new_end_time' => Carbon::parse('2026-11-16 10:00:00', 'Asia/Jakarta')->utc(),
            'status' => 'ditolak',
            'reason' => 'Penawaran pertama.',
            'respond_deadline' => $now->copy()->addHours(24),
            'responded_at' => $now,
            'refund_paused_at' => $now,
        ]);

        // Mentor mencoba memberikan penawaran kedua.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 10:00:00',
                'reason' => 'Mencoba memberikan penawaran kedua.',
            ]);

        // Pastikan sistem menolak penawaran kedua.
        $response->assertRedirect('/mentor/dashboard');

        // Pastikan hanya ada satu penawaran untuk sesi tersebut.
        $this->assertSame(
            1,
            RescheduleRequest::query()
                ->where('session_id', $session->id)
                ->where('request_type', 'refund_reschedule_offer')
                ->count()
        );
    }
    
    // test 6 menguji mentor dapat menawarkan jadwal pengganti untuk sesi gratis yang dibatalkan oleh mentor.
    public function test_mentor_can_offer_replacement_schedule_for_cancelled_free_session(): void
    {
        // Bekukan waktu pengujian.
        $now = Carbon::parse('2026-11-14 08:00:00', 'Asia/Jakarta');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor dengan jadwal tersedia.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'free',
            'price_per_session' => 0,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '11:00',
                    'type' => 'gratis',
                    'price' => 0,
                ],
            ],
        ]);

        // Buat sesi gratis yang dibatalkan mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta')->utc(),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'Asia/Jakarta')->utc(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ]);

        // Mentor menawarkan jadwal pengganti.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 09:00:00',
                'reason' => 'Menawarkan jadwal pengganti sesi gratis.',
            ]);

        // Pastikan penawaran berhasil dikirim.
        $response->assertRedirect('/mentor/dashboard');
        $response->assertSessionHasNoErrors();

        // Pastikan penawaran tersimpan.
        $offer = RescheduleRequest::query()
            ->where('session_id', $session->id)
            ->where('request_type', 'refund_reschedule_offer')
            ->firstOrFail();

        $this->assertSame('mentor', $offer->requested_by);
        $this->assertSame('menunggu_respons', $offer->status);

        // Sesi gratis tidak perlu menghentikan proses refund.
        $this->assertNull($offer->refund_paused_at);

        // Pastikan sesi tetap dibatalkan sampai mentee merespons.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertTrue($session->is_free_session);
        $this->assertSame('tidak_berlaku', $session->refund_status);
        $this->assertNull($session->refund_deadline);
    }


    // test 7 menguji mentor tidak dapat menawarkan jadwal pengganti untuk sesi gratis yang dibatalkan oleh mentee.
    public function test_mentor_cannot_offer_replacement_schedule_for_free_session_cancelled_by_student(): void
    {
        // Bekukan waktu pengujian.
        $now = Carbon::parse('2026-11-14 08:00:00', 'Asia/Jakarta');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor dengan jadwal tersedia.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'free',
            'price_per_session' => 0,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '11:00',
                    'type' => 'gratis',
                    'price' => 0,
                ],
            ],
        ]);

        // Buat sesi gratis yang dibatalkan oleh mentee.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta')->utc(),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'Asia/Jakarta')->utc(),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'cancelled_by' => 'student',
            'cancellation_reason' => 'Mentee berhalangan hadir.',
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ]);

        // Mentor mencoba menawarkan jadwal pengganti.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 09:00:00',
                'reason' => 'Mencoba menawarkan jadwal pengganti.',
            ]);

        // Pastikan request kembali ke dashboard mentor.
        $response->assertNotFound();

        // Pastikan tidak ada penawaran yang tersimpan.
        $this->assertSame(
            0,
            RescheduleRequest::query()
                ->where('session_id', $session->id)
                ->where('request_type', 'refund_reschedule_offer')
                ->count()
        );

        // Pastikan sesi tetap dibatalkan.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('student', $session->cancelled_by);
    }

    // test 8 menguji mahasiswa tidak dapat merespons penawaran jadwal pengganti milik mahasiswa lain.
    public function test_student_cannot_respond_to_another_students_refund_reschedule_offer(): void
    {
        // Bekukan waktu pengujian.
        $now = Carbon::parse('2026-11-14 08:00:00', 'Asia/Jakarta');
        $this->travelTo($now);

        // Buat akun mentor, pemilik sesi, dan mahasiswa lain.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $otherStudent = User::factory()->student()->create();

        // Buat sesi berbayar milik mahasiswa pertama.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta')->utc(),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'Asia/Jakarta')->utc(),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addHours(36),
        ]);

        // Buat penawaran jadwal pengganti dari mentor.
        $offer = RescheduleRequest::query()->create([
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'old_schedule_time' => $session->schedule_time,
            'old_end_time' => $session->end_time,
            'new_schedule_time' => Carbon::parse('2026-11-16 09:00:00', 'Asia/Jakarta')->utc(),
            'new_end_time' => Carbon::parse('2026-11-16 10:00:00', 'Asia/Jakarta')->utc(),
            'status' => 'menunggu_respons',
            'reason' => 'Menawarkan jadwal pengganti.',
            'respond_deadline' => $now->copy()->addHours(24),
            'refund_paused_at' => $now,
        ]);

        // Mahasiswa kedua mencoba menerima tawaran milik mahasiswa pertama.
        $response = $this->actingAs($otherStudent)
            ->patch(route('student.bookings.refund-reschedule.respond', [
                'id' => $session->id,
            ]), [
                'action' => 'terima',
            ]);

        // Pastikan sistem menolak akses mahasiswa kedua.
        $response->assertNotFound();

        // Pastikan status penawaran tidak berubah.
        $this->assertDatabaseHas('mentoring_reschedule_requests', [
            'id' => $offer->id,
            'status' => 'menunggu_respons',
        ]);

        // Pastikan sesi tetap dibatalkan dan jadwal tidak berubah.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame(
            Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta')->utc()->toDateTimeString(),
                $session->schedule_time->copy()->utc()->toDateTimeString()
        );
    }

    // test 9 menguji mentor dapat menawarkan jadwal pengganti untuk sesi berbayar yang dibatalkan oleh sistem.
    public function test_mentor_can_offer_replacement_schedule_for_paid_session_cancelled_by_system(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian.
        $now = Carbon::parse('2026-11-14 08:00:00', 'Asia/Jakarta');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor dengan jadwal tersedia.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '11:00',
                    'type' => 'berbayar',
                    'price' => 50000,
                ],
            ],
        ]);

        // Buat sesi berbayar yang dibatalkan sistem.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'Asia/Jakarta'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'Asia/Jakarta'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'sistem',
            'cancellation_reason' => 'Sesi dibatalkan oleh sistem.',
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(36),
        ]);

        // Mentor menawarkan jadwal pengganti.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 09:00:00',
                'reason' => 'Menawarkan jadwal pengganti.',
            ]);

        // Pastikan permintaan berhasil.
        $response->assertRedirect('/mentor/dashboard');
        $response->assertSessionHasNoErrors();

        // Pastikan penawaran tersimpan.
        $this->assertDatabaseHas('mentoring_reschedule_requests', [
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'status' => 'menunggu_respons',
            'reason' => 'Menawarkan jadwal pengganti.',
        ]);

        // Periksa detail penawaran.
        $offer = RescheduleRequest::query()
            ->where('session_id', $session->id)
            ->firstOrFail();

        $this->assertEquals(
            '2026-11-16 02:00:00',
            $offer->new_schedule_time->format('Y-m-d H:i:s')
        );

        $this->assertTrue(
            $offer->respond_deadline->equalTo($now->copy()->addHours(24))
        );

        $this->assertNotNull($offer->refund_paused_at);

        // Pastikan sesi lama tetap dibatalkan dan refund masih menunggu.
        $this->assertDatabaseHas('mentoring_sessions', [
            'id' => $session->id,
            'status' => 'dibatalkan',
            'refund_status' => 'menunggu',
            'cancelled_by' => 'sistem',
        ]);
    }

   
    // Test 10 menguji mentor tidak dapat menawarkan jadwal pengganti jika batas waktu refund sudah lewat.
    public function test_mentor_cannot_offer_replacement_schedule_after_refund_deadline(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian menggunakan timezone UTC sesuai aplikasi.
        $now = Carbon::parse('2026-11-14 01:00:00', 'UTC');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor dengan jadwal tersedia.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '11:00',
                    'type' => 'berbayar',
                    'price' => 50000,
                ],
            ],
        ]);

        // Buat sesi berbayar yang dibatalkan mentor dengan batas refund yang sudah lewat.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'UTC'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'UTC'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->subHour(),
        ]);

        // Mentor mencoba menawarkan jadwal pengganti setelah batas refund lewat.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 09:00:00',
                'reason' => 'Menawarkan jadwal pengganti.',
            ]);

        // Pastikan sistem menolak penawaran karena batas refund sudah lewat.
        $response->assertNotFound();

        // Pastikan tidak ada penawaran yang tersimpan.
        $this->assertSame(
            0,
            RescheduleRequest::query()
                ->where('session_id', $session->id)
                ->where('request_type', 'refund_reschedule_offer')
                ->count()
        );

        // Pastikan status sesi dan refund tidak berubah.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('menunggu', $session->refund_status);
        $this->assertSame('mentor', $session->cancelled_by);
    }


    // Test 11 menguji mentor tidak dapat menawarkan jadwal di luar availability.
    public function test_mentor_cannot_offer_replacement_schedule_outside_availability(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian menggunakan timezone UTC.
        $now = Carbon::parse('2026-11-14 01:00:00', 'UTC');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor dengan availability Senin pukul 09.00–11.00.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '11:00',
                    'type' => 'berbayar',
                    'price' => 50000,
                ],
            ],
        ]);

        // Buat sesi berbayar yang dibatalkan mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'UTC'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'UTC'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addDays(2),
        ]);

        // Mentor mencoba menawarkan jadwal Senin pukul 13.00–14.00,
        // padahal availability hanya sampai pukul 11.00.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 13:00:00',
                'reason' => 'Menawarkan jadwal pengganti.',
            ]);

        // Pastikan sistem menolak jadwal di luar availability.
        $response->assertSessionHasErrors('schedule_time');

        // Pastikan tidak ada penawaran yang tersimpan.
        $this->assertSame(
            0,
            RescheduleRequest::query()
                ->where('session_id', $session->id)
                ->where('request_type', 'refund_reschedule_offer')
                ->count()
        );

        // Pastikan status sesi dan refund tidak berubah.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('menunggu', $session->refund_status);
        $this->assertSame('mentor', $session->cancelled_by);
    }


    // Test 12 menguji mentor tidak dapat menawarkan jadwal yang bertabrakan dengan sesi lain.
    public function test_mentor_cannot_offer_replacement_schedule_that_overlaps_another_session(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian menggunakan timezone UTC.
        $now = Carbon::parse('2026-11-14 01:00:00', 'UTC');
        $this->travelTo($now);

        // Buat akun mentor dan dua mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();
        $otherStudent = User::factory()->student()->create();

        // Buat profil mentor dengan availability Senin pukul 09.00–11.00.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '11:00',
                    'type' => 'berbayar',
                    'price' => 50000,
                ],
            ],
        ]);

        // Buat sesi yang dibatalkan dan akan ditawarkan jadwal pengganti.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'UTC'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'UTC'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addDays(2),
        ]);

        // Buat sesi lain yang sudah dikonfirmasi pada pukul 09.00–10.00 WIB.
        MentoringSession::query()->create([
            'student_id' => $otherStudent->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => Carbon::parse('2026-11-16 09:00:00', 'Asia/Jakarta')->utc(),
            'end_time' => Carbon::parse('2026-11-16 10:00:00', 'Asia/Jakarta')->utc(),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
        ]);

        // Mentor mencoba menawarkan jadwal pukul 09.30–10.30.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 09:30:00',
                'reason' => 'Menawarkan jadwal pengganti.',
            ]);

        // Pastikan sistem menolak jadwal yang bertabrakan.
        $response->assertSessionHasErrors('schedule_time');

        // Pastikan tidak ada penawaran yang tersimpan.
        $this->assertSame(
            0,
            RescheduleRequest::query()
                ->where('session_id', $session->id)
                ->where('request_type', 'refund_reschedule_offer')
                ->count()
        );

        // Pastikan status sesi yang dibatalkan dan refund tidak berubah.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('menunggu', $session->refund_status);
        $this->assertSame('mentor', $session->cancelled_by);
    }


    // Test 13 menguji mentor tidak dapat menawarkan jadwal lebih dari 10 hari ke depan.
    public function test_mentor_cannot_offer_replacement_schedule_more_than_10_days_ahead(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian menggunakan timezone UTC.
        $now = Carbon::parse('2026-11-14 01:00:00', 'UTC');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor dengan availability pada hari Rabu.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'rabu',
                    'start' => '09:00',
                    'end' => '11:00',
                    'type' => 'berbayar',
                    'price' => 50000,
                ],
            ],
        ]);

        // Buat sesi berbayar yang dibatalkan mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'UTC'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'UTC'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addDays(2),
        ]);

        // Mentor mencoba menawarkan jadwal pada 25 November 2026.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-25 09:00:00',
                'reason' => 'Menawarkan jadwal pengganti.',
            ]);

        // Pastikan sistem menolak jadwal yang melewati batas 10 hari.
        $response->assertSessionHasErrors('schedule_time');

        // Pastikan tidak ada penawaran yang tersimpan.
        $this->assertSame(
            0,
            RescheduleRequest::query()
                ->where('session_id', $session->id)
                ->where('request_type', 'refund_reschedule_offer')
                ->count()
        );

        // Pastikan status sesi dan refund tidak berubah.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('menunggu', $session->refund_status);
        $this->assertSame('mentor', $session->cancelled_by);
    }


    
    // Test 14 menguji durasi sesi tetap mengikuti durasi sesi awal.
    public function test_mentor_offer_keeps_original_session_duration(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian menggunakan timezone UTC.
        $now = Carbon::parse('2026-11-14 01:00:00', 'UTC');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor dengan availability Senin pukul 09.00–12.00.
        MentorProfile::query()->create([
            'user_id' => $mentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '12:00',
                    'type' => 'berbayar',
                    'price' => 50000,
                ],
            ],
        ]);

        // Buat sesi awal dengan durasi 1 jam.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'UTC'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'UTC'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addDays(2),
        ]);

        // Mentor menawarkan jadwal pengganti pukul 09.00 WIB.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 09:00:00',
                'reason' => 'Menawarkan jadwal pengganti.',
            ]);

        // Pastikan penawaran berhasil dibuat.
        $response->assertSessionHasNoErrors();
        $response->assertSessionHas(
            'success',
            'Tawaran jadwal pengganti berhasil dikirim kepada mentee.'
        );

        // Ambil data penawaran jadwal pengganti.
        $offer = RescheduleRequest::query()
            ->where('session_id', $session->id)
            ->where('request_type', 'refund_reschedule_offer')
            ->firstOrFail();

        // Pastikan jadwal pengganti berdurasi 1 jam, bukan 2 jam.
        $newStart = Carbon::parse($offer->new_schedule_time);
        $newEnd = Carbon::parse($offer->new_end_time);

        $this->assertEquals(
            3600,
            abs($newEnd->diffInSeconds($newStart))
        );

        // Pastikan waktu selesai adalah pukul 10.00 WIB.
        $this->assertEquals(
            '2026-11-16 10:00:00',
            $newEnd->setTimezone('Asia/Jakarta')->format('Y-m-d H:i:s')
        );

        // Pastikan durasi sesi awal tidak berubah.
        $session->refresh();
        $this->assertSame(1, (int) $session->duration_hours);
    }

    
    // Test 16 menguji mentor tidak bisa menawarkan jadwal pengganti
    // untuk sesi yang dimiliki oleh mentor lain.
    public function test_mentor_cannot_offer_replacement_schedule_for_another_mentors_session(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian menggunakan timezone UTC.
        $now = Carbon::parse('2026-11-14 01:00:00', 'UTC');
        $this->travelTo($now);

        // Buat dua akun mentor dan satu mentee.
        $mentor = User::factory()->mentor()->create();
        $otherMentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat profil mentor pemilik sesi.
        MentorProfile::query()->create([
            'user_id' => $otherMentor->id,
            'expertise' => 'Web Development',
            'verification_status' => 'verified',
            'mentor_type' => 'paid',
            'price_per_session' => 50000,
            'is_available' => true,
            'is_suspended' => false,
            'availability_schedule' => [
                [
                    'day' => 'senin',
                    'start' => '09:00',
                    'end' => '12:00',
                    'type' => 'berbayar',
                    'price' => 50000,
                ],
            ],
        ]);

        // Buat sesi yang dimiliki oleh mentor lain.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $otherMentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'UTC'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'UTC'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addDays(2),
        ]);

        // Mentor lain mencoba menawarkan jadwal pengganti.
        $response = $this->actingAs($mentor)
            ->from('/mentor/dashboard')
            ->post(route('mentor.refund.reschedule-offer', [
                'id' => $session->id,
            ]), [
                'schedule_time' => '2026-11-16 09:00:00',
                'reason' => 'Mencoba menawarkan jadwal pengganti.',
            ]);

        // Pastikan sistem menolak akses dengan respons 404.
        $response->assertNotFound();

        // Pastikan tidak ada penawaran jadwal pengganti yang dibuat.
        $this->assertSame(
            0,
            RescheduleRequest::query()
                ->where('session_id', $session->id)
                ->where('request_type', 'refund_reschedule_offer')
                ->count()
        );

        // Pastikan kondisi sesi awal tidak berubah.
        $session->refresh();

        $this->assertSame('dibatalkan', $session->status);
        $this->assertSame('menunggu', $session->refund_status);
        $this->assertSame($otherMentor->id, $session->mentor_id);
    }


    // Test 17 menguji mentee dapat menerima tawaran jadwal pengganti
    // untuk sesi gratis yang dibatalkan oleh mentor.
    public function test_student_can_accept_free_refund_reschedule_offer(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian menggunakan timezone UTC.
        $now = Carbon::parse('2026-11-14 01:00:00', 'UTC');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat sesi gratis yang dibatalkan oleh mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'UTC'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'UTC'),
            'duration_hours' => 1,
            'is_free_session' => true,
            'price_snapshot' => 0,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'tidak_berlaku',
            'refund_deadline' => null,
        ]);

        // Buat penawaran jadwal pengganti dari mentor.
        $offer = RescheduleRequest::query()->create([
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'old_schedule_time' => $session->schedule_time,
            'old_end_time' => $session->end_time,
            'new_schedule_time' => Carbon::parse(
                '2026-11-16 09:00:00',
                'Asia/Jakarta'
            )->utc(),
            'new_end_time' => Carbon::parse(
                '2026-11-16 10:00:00',
                'Asia/Jakarta'
            )->utc(),
            'status' => 'menunggu_respons',
            'reason' => 'Menawarkan jadwal pengganti.',
            'respond_deadline' => $now->copy()->addHours(24),
            'refund_paused_at' => null,
        ]);

        // Mentee menerima tawaran jadwal pengganti.
        $response = $this->actingAs($student)
            ->patch(route('student.bookings.refund-reschedule.respond', [
                'id' => $session->id,
            ]), [
                'action' => 'terima',
            ]);

        // Pastikan respons berhasil.
        $response->assertRedirect(route('student.bookings.index'));
        $response->assertSessionHasNoErrors();

        // Pastikan status penawaran berubah menjadi diterima.
        $offer->refresh();

        $this->assertSame('diterima', $offer->status);

        // Pastikan sesi kembali dikonfirmasi.
        $session->refresh();

        $this->assertSame('dikonfirmasi', $session->status);

        // Pastikan jadwal sesi berubah sesuai tawaran.
        $this->assertEquals(
            Carbon::parse('2026-11-16 09:00:00', 'Asia/Jakarta')->utc()->timestamp,
            Carbon::parse($session->schedule_time)->timestamp
        );

        $this->assertEquals(
            Carbon::parse('2026-11-16 10:00:00', 'Asia/Jakarta')->utc()->timestamp,
            Carbon::parse($session->end_time)->timestamp
        );

        // Pastikan sesi gratis tidak memiliki proses refund.
        $this->assertSame('tidak_berlaku', $session->refund_status);
        $this->assertNull($session->refund_deadline);

        // Pastikan informasi pembatalan sebelumnya dibersihkan.
        $this->assertNull($session->cancelled_by);
        $this->assertNull($session->cancellation_reason);
    }


    // Test 19 menguji mentee tidak dapat menerima tawaran
    // jadwal pengganti setelah melewati batas waktu 24 jam.
    public function test_student_cannot_accept_expired_refund_reschedule_offer(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian menggunakan timezone UTC.
        $now = Carbon::parse('2026-11-14 01:00:00', 'UTC');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat sesi berbayar yang dibatalkan oleh mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'UTC'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'UTC'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addDays(2),
        ]);

        // Buat penawaran jadwal pengganti dengan batas respons 24 jam.
        $offer = RescheduleRequest::query()->create([
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'old_schedule_time' => $session->schedule_time,
            'old_end_time' => $session->end_time,
            'new_schedule_time' => Carbon::parse(
                '2026-11-16 09:00:00',
                'Asia/Jakarta'
            )->utc(),
            'new_end_time' => Carbon::parse(
                '2026-11-16 10:00:00',
                'Asia/Jakarta'
            )->utc(),
            'status' => 'menunggu_respons',
            'reason' => 'Menawarkan jadwal pengganti.',
            'respond_deadline' => $now->copy()->addHours(24),
            'refund_paused_at' => $now,
        ]);

        // Majukan waktu pengujian menjadi 25 jam setelah penawaran dibuat.
        $expiredAt = $now->copy()->addHours(25);
        $this->travelTo($expiredAt);

        // Mentee mencoba menerima tawaran yang sudah kedaluwarsa.
        $response = $this->actingAs($student)
            ->patch(route('student.bookings.refund-reschedule.respond', [
                'id' => $session->id,
            ]), [
                'action' => 'terima',
            ]);

        // Pastikan tawaran tidak diterima dan berubah menjadi kedaluwarsa.
        $offer->refresh();
        $this->assertSame('kedaluwarsa', $offer->status);

        // Pastikan sesi tetap dibatalkan.
        $session->refresh();
        $this->assertSame('dibatalkan', $session->status);

        // Pastikan status refund kembali menunggu.
        $this->assertSame('menunggu', $session->refund_status);

        // Pastikan batas waktu refund dimulai kembali selama 48 jam.
        $this->assertEquals(
            $expiredAt->copy()->addHours(48)->timestamp,
            Carbon::parse($session->refund_deadline)->timestamp
        );

        // Pastikan jadwal sesi tidak berubah menjadi jadwal pengganti.
        $this->assertNotEquals(
            Carbon::parse($offer->new_schedule_time)->timestamp,
            Carbon::parse($session->schedule_time)->timestamp
        );
    }


    // Test 20 menguji mentee tidak dapat menerima kembali
    // tawaran jadwal pengganti yang sudah ditolak.
    public function test_student_cannot_accept_already_rejected_refund_reschedule_offer(): void
    {
        Notification::fake();

        // Bekukan waktu pengujian menggunakan timezone UTC.
        $now = Carbon::parse('2026-11-14 01:00:00', 'UTC');
        $this->travelTo($now);

        // Buat akun mentor dan mentee.
        $mentor = User::factory()->mentor()->create();
        $student = User::factory()->student()->create();

        // Buat sesi berbayar yang dibatalkan oleh mentor.
        $session = MentoringSession::query()->create([
            'student_id' => $student->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => Carbon::parse('2026-11-13 09:00:00', 'UTC'),
            'end_time' => Carbon::parse('2026-11-13 10:00:00', 'UTC'),
            'duration_hours' => 1,
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Mentor berhalangan hadir.',
            'refund_status' => 'menunggu',
            'refund_deadline' => $now->copy()->addDays(2),
        ]);

        // Buat penawaran jadwal pengganti yang masih menunggu respons.
        $offer = RescheduleRequest::query()->create([
            'session_id' => $session->id,
            'requested_by' => 'mentor',
            'request_type' => 'refund_reschedule_offer',
            'old_schedule_time' => $session->schedule_time,
            'old_end_time' => $session->end_time,
            'new_schedule_time' => Carbon::parse(
                '2026-11-16 09:00:00',
                'Asia/Jakarta'
            )->utc(),
            'new_end_time' => Carbon::parse(
                '2026-11-16 10:00:00',
                'Asia/Jakarta'
            )->utc(),
            'status' => 'menunggu_respons',
            'reason' => 'Menawarkan jadwal pengganti.',
            'respond_deadline' => $now->copy()->addHours(24),
            'refund_paused_at' => $now,
        ]);

        // Mentee menolak tawaran pertama kali.
        $this->actingAs($student)
            ->patch(route('student.bookings.refund-reschedule.respond', [
                'id' => $session->id,
            ]), [
                'action' => 'tolak',
            ]);

        // Pastikan penawaran sudah berstatus ditolak.
        $offer->refresh();
        $this->assertSame('ditolak', $offer->status);

        // Simpan deadline refund setelah penolakan.
        $session->refresh();
        $refundDeadlineAfterRejection = Carbon::parse(
            $session->refund_deadline
        )->timestamp;

        // Mentee mencoba menerima kembali tawaran yang sudah ditolak.
        $this->patch(route('student.bookings.refund-reschedule.respond', [
            'id' => $session->id,
        ]), [
            'action' => 'terima',
        ]);

        // Pastikan status penawaran tetap ditolak.
        $offer->refresh();
        $this->assertSame('ditolak', $offer->status);

        // Pastikan sesi tetap dibatalkan.
        $session->refresh();
        $this->assertSame('dibatalkan', $session->status);

        // Pastikan refund tetap menunggu.
        $this->assertSame('menunggu', $session->refund_status);

        // Pastikan deadline refund tidak berubah akibat respons kedua.
        $this->assertEquals(
            $refundDeadlineAfterRejection,
            Carbon::parse($session->refund_deadline)->timestamp
        );
    }

}
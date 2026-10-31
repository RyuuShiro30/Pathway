<?php

namespace Database\Seeders;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\MentorSuspension;
use App\Models\NoShowReport;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class MentoringWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Admin Akun
        User::updateOrCreate(
            ['email' => 'pathway@admin.com'],
            [
                'name' => 'Pathway Admin',
                'password' => 'password',
                'email_verified_at' => $now,
            ]
        );

        // 2. Mentor Utama (mentor@test.com)
        $mainMentor = User::updateOrCreate(
            ['email' => 'mentor@test.com'],
            [
                'name' => 'Budi Mentor',
                'password' => 'password',
                'email_verified_at' => $now,
                'bank_name' => 'BCA',
                'bank_account_number' => '1122334455',
                'bank_account_holder' => 'Budi Mentor',
            ]
        );

        MentorProfile::updateOrCreate(
            ['user_id' => $mainMentor->id],
            [
                'expertise' => 'Fullstack Web Development & Cloud Architecture',
                'bio' => 'Senior Developer dengan pengalaman 8+ tahun di industri tech. Siap membimbing seputar Laravel, React, dan System Design.',
                'portfolio_url' => 'https://github.com/budimentor',
                'verification_status' => 'verified',
                'mentor_type' => 'paid',
                'price_per_session' => 100000,
                'avg_rating' => 4.90,
                'is_available' => true,
                'is_suspended' => false,
                'discord_room_link' => 'https://discord.gg/pathway-budi',
                'availability_schedule' => [
                    ['day' => 'senin', 'start' => '09:00', 'end' => '12:00', 'type' => 'berbayar', 'price' => 100000],
                    ['day' => 'selasa', 'start' => '13:00', 'end' => '16:00', 'type' => 'berbayar', 'price' => 100000],
                    ['day' => 'rabu', 'start' => '10:00', 'end' => '12:00', 'type' => 'gratis', 'price' => null],
                    ['day' => 'kamis', 'start' => '14:00', 'end' => '17:00', 'type' => 'berbayar', 'price' => 100000],
                    ['day' => 'jumat', 'start' => '09:00', 'end' => '11:00', 'type' => 'gratis', 'price' => null],
                ],
            ]
        );

        // 3. Mentor Disuspend (mentor.suspend@test.com)
        $suspendedMentor = User::updateOrCreate(
            ['email' => 'mentor.suspend@test.com'],
            [
                'name' => 'Joko Suspended',
                'password' => 'password',
                'email_verified_at' => $now,
                'bank_name' => 'Mandiri',
                'bank_account_number' => '9988776655',
                'bank_account_holder' => 'Joko Suspended',
            ]
        );

        MentorProfile::updateOrCreate(
            ['user_id' => $suspendedMentor->id],
            [
                'expertise' => 'DevOps & CI/CD Pipelines',
                'bio' => 'Mentor spesialis infrastruktur dan automation.',
                'portfolio_url' => 'https://github.com/jokodev',
                'verification_status' => 'verified',
                'mentor_type' => 'paid',
                'price_per_session' => 120000,
                'avg_rating' => 4.20,
                'is_available' => false,
                'is_suspended' => true,
                'discord_room_link' => 'https://discord.gg/pathway-joko',
            ]
        );

        // 4. Murid Utama (murid@test.com) & Murid Pendukung
        $mainStudent = User::updateOrCreate(
            ['email' => 'murid@test.com'],
            [
                'name' => 'Siti Murid',
                'password' => 'password',
                'email_verified_at' => $now,
                'bank_name' => 'BNI',
                'bank_account_number' => '5566778899',
                'bank_account_holder' => 'Siti Murid',
            ]
        );

        $studentNoShow = User::updateOrCreate(
            ['email' => 'murid.noshow@test.com'],
            [
                'name' => 'Andi NoShow',
                'password' => 'password',
                'email_verified_at' => $now,
                'bank_name' => 'BCA',
                'bank_account_number' => '7788990011',
                'bank_account_holder' => 'Andi NoShow',
            ]
        );

        $studentCancel = User::updateOrCreate(
            ['email' => 'murid.cancel@test.com'],
            [
                'name' => 'Rina Pembatalan',
                'password' => 'password',
                'email_verified_at' => $now,
                'bank_name' => 'BRI',
                'bank_account_number' => '3344556677',
                'bank_account_holder' => 'Rina Pembatalan',
            ]
        );

        // ==========================================
        // 19 SKENARIO ALUR MENTORING
        // ==========================================

        // Skenario 3: Pengajuan terlewat/kadaluwarsa sebelum direspons mentor (Badge Jadwal Terlewat di MyBookings)
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-03: Konsultasi arsitektur microservices (Jadwal Terlewat)',
            ],
            [
                'status' => 'diajukan',
                'schedule_time' => $now->copy()->subHours(6),
                'end_time' => $now->copy()->subHours(5),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'menunggu_verifikasi',
                'created_at' => $now->copy()->subHours(10),
            ]
        );

        // Skenario 4: Sesi gratis dikonfirmasi
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-04: Sesi mentoring gratis tanya jawab karir (Dikonfirmasi)',
            ],
            [
                'status' => 'dikonfirmasi',
                'schedule_time' => $now->copy()->addDays(2)->setTime(10, 0),
                'end_time' => $now->copy()->addDays(2)->setTime(11, 0),
                'duration_hours' => 1,
                'is_free_session' => true,
                'price_snapshot' => 0,
                'payment_dp_status' => 'tidak_berlaku',
                'discord_link' => 'https://discord.gg/pathway-budi',
            ]
        );

        // Skenario 7: Sesi berbayar sedang berlangsung
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-07: Live code review PR fitur pembayaran (Berlangsung Berbayar)',
            ],
            [
                'status' => 'berlangsung',
                'schedule_time' => $now->copy()->subMinutes(30),
                'end_time' => $now->copy()->addMinutes(30),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'discord_link' => 'https://discord.gg/pathway-budi',
            ]
        );

        // Skenario 8: Sesi selesai belum diulas (Murid bisa klik "Beri Ulasan")
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-08: Belajar query optimization database SQL (Selesai Belum Diulas)',
            ],
            [
                'status' => 'selesai',
                'schedule_time' => $now->copy()->subDays(2)->setTime(14, 0),
                'end_time' => $now->copy()->subDays(2)->setTime(15, 0),
                'duration_hours' => 1,
                'notes_from_mentor' => 'Mentee sudah memahami explain analyze dan pembuatan index komposit.',
                'proof_file' => 'session-proofs/sample-session.png',
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'discord_link' => 'https://discord.gg/pathway-budi',
            ]
        );

        // Skenario 9: Sesi selesai sudah diulas (Memiliki relasi Review & Rating)
        $reviewedSession = MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-09: Belajar Inertia React state management (Selesai Sudah Diulas)',
            ],
            [
                'status' => 'selesai',
                'schedule_time' => $now->copy()->subDays(4)->setTime(10, 0),
                'end_time' => $now->copy()->subDays(4)->setTime(11, 0),
                'duration_hours' => 1,
                'notes_from_mentor' => 'Penjelasan clear, murid berhasil implementasi form helper.',
                'proof_file' => 'session-proofs/sample-session.png',
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'discord_link' => 'https://discord.gg/pathway-budi',
            ]
        );

        Review::updateOrCreate(
            ['session_id' => $reviewedSession->id],
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'rating' => 5,
                'feedback' => 'Penjelasan Mas Budi sangat mudah dipahami dan to the point! Sangat recommended.',
            ]
        );

        // Skenario 11: Sesi gratis ditolak mentor
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-11: Tanya seputar magang frontend (Ditolak Mentor Gratis)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->addDays(3)->setTime(11, 0),
                'end_time' => $now->copy()->addDays(3)->setTime(12, 0),
                'duration_hours' => 1,
                'is_free_session' => true,
                'price_snapshot' => 0,
                'payment_dp_status' => 'tidak_berlaku',
                'cancelled_by' => 'mentor',
                'cancellation_reason' => 'Mohon maaf, slot gratis untuk minggu ini sudah penuh.',
                'refund_status' => 'tidak_berlaku',
            ]
        );

        // Skenario 12: Sesi berbayar dibatalkan mentee saat masih diajukan (Berhak refund DP)
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-12: Belajar API Gateway (Batal Mentee Saat Diajukan - Menunggu Refund)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->addDays(4)->setTime(13, 0),
                'end_time' => $now->copy()->addDays(4)->setTime(15, 0),
                'duration_hours' => 2,
                'is_free_session' => false,
                'price_snapshot' => 200000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'menunggu_verifikasi',
                'cancelled_by' => 'mentee',
                'cancellation_reason' => 'Tiba-tiba ada jadwal ujian kampus mendadak.',
                'refund_status' => 'menunggu',
                'refund_deadline' => $now->copy()->addHours(42),
            ]
        );

        // Skenario 13: Sesi gratis dibatalkan mentee saat masih diajukan
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-13: Diskusi roadmap web developer (Batal Mentee Saat Diajukan Gratis)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->addDays(5)->setTime(14, 0),
                'end_time' => $now->copy()->addDays(5)->setTime(15, 0),
                'duration_hours' => 1,
                'is_free_session' => true,
                'price_snapshot' => 0,
                'payment_dp_status' => 'tidak_berlaku',
                'cancelled_by' => 'mentee',
                'cancellation_reason' => 'Saya berhalangan hadir pada jam tersebut.',
                'refund_status' => 'tidak_berlaku',
            ]
        );

        // Skenario 14: Sesi berbayar dibatalkan mentor setelah dikonfirmasi (Menunggu refund DP)
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-14: Bedah source code Laravel 11 (Batal Mentor Dikonfirmasi)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->subHours(12),
                'end_time' => $now->copy()->subHours(11),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'cancelled_by' => 'mentor',
                'cancellation_reason' => 'Ada pemadaman listrik di area saya sehingga tidak bisa online.',
                'refund_status' => 'menunggu',
                'refund_deadline' => $now->copy()->addHours(36),
            ]
        );

        // Skenario 16: Dibatalkan otomatis sistem (Auto-cancel 24 jam tidak direspon)
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-16: Pengajuan mentoring Docker container (Auto Cancel Sistem)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->addDays(1)->setTime(15, 0),
                'end_time' => $now->copy()->addDays(1)->setTime(16, 0),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'menunggu_verifikasi',
                'cancelled_by' => 'sistem',
                'cancellation_reason' => 'Dibatalkan otomatis oleh sistem: mentor tidak merespons dalam 24 jam.',
                'refund_status' => 'menunggu',
                'refund_deadline' => $now->copy()->addHours(24),
                'created_at' => $now->copy()->subHours(25),
            ]
        );

        // Skenario 17: Refund menunggu yang melewati batas waktu / Overdue (>48 jam badge merah)
        MentoringSession::updateOrCreate(
            [
                'student_id' => $studentCancel->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-17: Mentoring TypeScript (Refund Melewati Batas Waktu / Overdue)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->subDays(3)->setTime(13, 0),
                'end_time' => $now->copy()->subDays(3)->setTime(14, 0),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'cancelled_by' => 'mentor',
                'cancellation_reason' => 'Mendadak sakit flu berat.',
                'refund_status' => 'menunggu',
                'refund_deadline' => $now->copy()->subHours(8), // Sudah lewat deadline
            ]
        );

        // Skenario 18: Bukti refund diunggah mentor, menunggu konfirmasi mentee (Badge "Menunggu Konfirmasi Anda")
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-18: Konsultasi backend queue Redis (Refund Menunggu Konfirmasi Mentee)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->subDays(2)->setTime(10, 0),
                'end_time' => $now->copy()->subDays(2)->setTime(11, 0),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'cancelled_by' => 'mentor',
                'cancellation_reason' => 'Jadwal bertabrakan dengan workshop internal.',
                'refund_proof' => 'refund-proofs/sample-refund.png',
                'refund_status' => 'menunggu_konfirmasi',
                'refund_deadline' => $now->copy()->addHours(20),
                'refund_proof_uploaded_at' => $now->copy()->subHours(4),
            ]
        );

        // Skenario 19: Refund selesai dikonfirmasi mentee (Badge hijau "Refund Selesai")
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-19: Setup CI/CD GitHub Actions (Refund Selesai Terkonfirmasi)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->subDays(5)->setTime(16, 0),
                'end_time' => $now->copy()->subDays(5)->setTime(17, 0),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'cancelled_by' => 'mentor',
                'cancellation_reason' => 'Peralatan laptop sedang diperbaiki.',
                'refund_proof' => 'refund-proofs/sample-refund.png',
                'refund_status' => 'selesai',
                'refund_proof_uploaded_at' => $now->copy()->subDays(2),
            ]
        );

        // Skenario 20: Refund dilaporkan belum diterima mentee ("Dilaporkan Belum Diterima")
        MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-20: Security audit Laravel app (Refund Dilaporkan Belum Diterima)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->subDays(4)->setTime(11, 0),
                'end_time' => $now->copy()->subDays(4)->setTime(12, 0),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'cancelled_by' => 'mentor',
                'cancellation_reason' => 'Ada kendala koneksi internet jaringan fiber optik.',
                'refund_proof' => 'refund-proofs/sample-refund.png',
                'refund_status' => 'dilaporkan',
                'refund_proof_uploaded_at' => $now->copy()->subDays(1),
            ]
        );

        // Skenario 21: No-show dilaporkan murid terhadap mentor (Mentor tidak hadir di Discord)
        $noShowByStudentSession = MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-21: Debugging memory leak PHP (No-Show Dilaporkan Murid)',
            ],
            [
                'status' => 'dikonfirmasi',
                'schedule_time' => $now->copy()->subHours(2),
                'end_time' => $now->copy()->subHour(),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'discord_link' => 'https://discord.gg/pathway-budi',
            ]
        );

        NoShowReport::updateOrCreate(
            ['session_id' => $noShowByStudentSession->id],
            [
                'reporter_id' => $mainStudent->id,
                'reported_user_id' => $mainMentor->id,
                'status' => 'menunggu_respons',
                'reporter_note' => 'Saya sudah menunggu di room Discord selama 25 menit, mentor tidak kunjung join.',
                'evidence_path' => 'no-show-reports/sample-evidence.png',
                'respond_deadline' => $now->copy()->addHours(22),
            ]
        );

        // Skenario 22: No-show dilaporkan mentor terhadap murid (Murid tidak hadir, murid perlu menanggapi)
        $noShowByMentorSession = MentoringSession::updateOrCreate(
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-22: Simulasi tech interview frontend (No-Show Dilaporkan Mentor)',
            ],
            [
                'status' => 'dikonfirmasi',
                'schedule_time' => $now->copy()->subHours(3),
                'end_time' => $now->copy()->subHours(2),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'discord_link' => 'https://discord.gg/pathway-budi',
            ]
        );

        NoShowReport::updateOrCreate(
            ['session_id' => $noShowByMentorSession->id],
            [
                'reporter_id' => $mainMentor->id,
                'reported_user_id' => $mainStudent->id,
                'status' => 'menunggu_respons',
                'reporter_note' => 'Student tidak hadir di voice channel sampai 30 menit sesi berjalan.',
                'evidence_path' => 'no-show-reports/sample-evidence.png',
                'respond_deadline' => $now->copy()->addHours(21),
            ]
        );

        // Skenario 23: No-show disanggah oleh terlapor (Menunggu keputusan admin)
        $noShowDisputedSession = MentoringSession::updateOrCreate(
            [
                'student_id' => $studentNoShow->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-23: Refactoring monolith ke modular (No-Show Disanggah)',
            ],
            [
                'status' => 'dikonfirmasi',
                'schedule_time' => $now->copy()->subHours(8),
                'end_time' => $now->copy()->subHours(7),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'discord_link' => 'https://discord.gg/pathway-budi',
            ]
        );

        NoShowReport::updateOrCreate(
            ['session_id' => $noShowDisputedSession->id],
            [
                'reporter_id' => $studentNoShow->id,
                'reported_user_id' => $mainMentor->id,
                'status' => 'disanggah',
                'reporter_note' => 'Mentor tidak muncul di voice call.',
                'evidence_path' => 'no-show-reports/sample-evidence.png',
                'respond_deadline' => $now->copy()->addHours(16),
                'response_note' => 'Saya hadir tepat waktu di room Discord dan mengirim pesan chat discord, ini bukti screenshot log aktivitasnya.',
                'response_evidence_path' => 'no-show-responses/sample-response.png',
                'responded_at' => $now->copy()->subHours(2),
            ]
        );

        // Skenario 24: Sesi batal akibat no-show berlaku / finalized
        $noShowFinalizedSession = MentoringSession::updateOrCreate(
            [
                'student_id' => $studentNoShow->id,
                'mentor_id' => $mainMentor->id,
                'notes_from_student' => 'SKENARIO-24: Setup Kubernetes cluster (No-Show Berlaku / Finalized)',
            ],
            [
                'status' => 'dibatalkan',
                'schedule_time' => $now->copy()->subDays(2)->setTime(15, 0),
                'end_time' => $now->copy()->subDays(2)->setTime(16, 0),
                'duration_hours' => 1,
                'is_free_session' => false,
                'price_snapshot' => 100000,
                'payment_dp_proof' => 'payment-proofs/sample-dp.png',
                'payment_dp_status' => 'terverifikasi',
                'cancelled_by' => 'mentor',
                'cancellation_reason' => 'Dibatalkan otomatis: laporan no-show terhadap mentor berlaku.',
                'refund_status' => 'menunggu',
                'refund_deadline' => $now->copy()->addHours(24),
            ]
        );

        NoShowReport::updateOrCreate(
            ['session_id' => $noShowFinalizedSession->id],
            [
                'reporter_id' => $studentNoShow->id,
                'reported_user_id' => $mainMentor->id,
                'status' => 'berlaku',
                'reporter_note' => 'Mentor tidak hadir dan tidak ada kabar.',
                'evidence_path' => 'no-show-reports/sample-evidence.png',
                'respond_deadline' => $now->copy()->subHour(),
                'finalized_at' => $now->copy()->subHour(),
            ]
        );

        // Skenario 25: Mentor disuspend (Record mentor_suspensions & profil is_suspended = true)
        MentorSuspension::updateOrCreate(
            [
                'mentor_id' => $suspendedMentor->id,
                'reason' => MentorSuspension::REASON_LATE_REFUND,
            ],
            [
                'session_id' => $noShowFinalizedSession->id,
                'note' => 'Mentor disuspend otomatis karena keterlambatan pengembalian dana refund melebihi 48 jam.',
                'suspended_at' => $now->copy()->subDays(1),
            ]
        );

        $this->command->info('MentoringWorkflowSeeder berhasil dijalankan: 19 skenario alur mentoring siap ditest.');
    }
}


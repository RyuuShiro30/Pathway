<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\MentoringSession;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MentoringSessionSeeder extends Seeder
{
    public function run(): void
    {
        $mentor = User::where('name', 'lili')->first();

        if (!$mentor) {
            $this->command->error('User mentor "lili" tidak ditemukan.');
            return;
        }

        // Bikin 5 mentee dummy sekaligus
        $mentees = collect([
            ['name' => 'Budi Mentee', 'email' => 'mentee@example.com'],
            ['name' => 'Siti Rahma', 'email' => 'siti@example.com'],
            ['name' => 'Andi Pratama', 'email' => 'andi@example.com'],
            ['name' => 'Dewi Lestari', 'email' => 'dewi@example.com'],
            ['name' => 'Rizky Hidayat', 'email' => 'rizky@example.com'],
        ])->map(function ($data) {
            return User::firstOrCreate(
                ['email' => $data['email']],
                ['name' => $data['name'], 'password' => Hash::make('password')]
            );
        });

        // 1. Sesi gratis, status diajukan (belum direspon mentor)
        MentoringSession::create([
            'student_id' => $mentees[0]->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => now()->addDays(2)->setTime(10, 0),
            'end_time' => now()->addDays(2)->setTime(11, 0),
            'duration_hours' => 1,
            'notes_from_student' => 'Mau tanya-tanya soal dasar React.',
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
        ]);

        // 2. Sesi berbayar, status diajukan, DP menunggu verifikasi
        MentoringSession::create([
            'student_id' => $mentees[1]->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => now()->addDays(3)->setTime(14, 0),
            'end_time' => now()->addDays(3)->setTime(16, 0),
            'duration_hours' => 2,
            'notes_from_student' => 'Butuh review arsitektur project akhir.',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'menunggu_verifikasi',
        ]);

        // 3. Sesi berbayar, sudah dikonfirmasi, siap buat "Mulai Sesi"
        MentoringSession::create([
            'student_id' => $mentees[2]->id,
            'mentor_id' => $mentor->id,
            'status' => 'dikonfirmasi',
            'schedule_time' => now()->addDay()->setTime(9, 0),
            'end_time' => now()->addDay()->setTime(10, 0),
            'duration_hours' => 1,
            'notes_from_student' => 'Mau konsultasi career switch ke web dev.',
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'payment_dp_status' => 'terverifikasi',
            'discord_link' => 'https://discord.gg/dummy-room-lili',
        ]);

        // 4. Sesi gratis, sedang berlangsung
        MentoringSession::create([
            'student_id' => $mentees[3]->id,
            'mentor_id' => $mentor->id,
            'status' => 'berlangsung',
            'schedule_time' => now()->subMinutes(20),
            'end_time' => now()->addMinutes(40),
            'duration_hours' => 1,
            'notes_from_student' => 'Review portfolio sebelum apply kerja.',
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
            'discord_link' => 'https://discord.gg/dummy-room-lili',
        ]);

        // 5. Sesi berbayar, sudah selesai (ada bukti mentoring)
        MentoringSession::create([
            'student_id' => $mentees[4]->id,
            'mentor_id' => $mentor->id,
            'status' => 'selesai',
            'schedule_time' => now()->subDays(3)->setTime(13, 0),
            'end_time' => now()->subDays(3)->setTime(14, 0),
            'duration_hours' => 1,
            'notes_from_student' => 'Mau belajar optimasi database.',
            'notes_from_mentor' => 'Student sudah paham dasar indexing, perlu latihan lebih lanjut soal query planning.',
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'payment_dp_status' => 'terverifikasi',
            'discord_link' => 'https://discord.gg/dummy-room-lili',
        ]);

        // 6. Sesi berbayar, dibatalkan mentor, menunggu refund (belum upload bukti)
        MentoringSession::create([
            'student_id' => $mentees[1]->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => now()->subDay()->setTime(10, 0),
            'end_time' => now()->subDay()->setTime(12, 0),
            'duration_hours' => 2,
            'notes_from_student' => 'Mau persiapan interview teknis.',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'terverifikasi',
            'cancelled_by' => 'mentor',
            'cancellation_reason' => 'Ada keperluan mendadak.',
            'refund_status' => 'menunggu',
            'refund_deadline' => now()->addHours(48),
        ]);

        // 7. Sesi berbayar, dibatalkan mentee sendiri (DP hangus, tidak ada refund)
        MentoringSession::create([
            'student_id' => $mentees[0]->id,
            'mentor_id' => $mentor->id,
            'status' => 'dibatalkan',
            'schedule_time' => now()->subDays(5)->setTime(15, 0),
            'end_time' => now()->subDays(5)->setTime(16, 0),
            'duration_hours' => 1,
            'notes_from_student' => 'Mau belajar Git dan GitHub.',
            'is_free_session' => false,
            'price_snapshot' => 50000,
            'payment_dp_status' => 'terverifikasi',
            'cancelled_by' => 'mentee',
            'cancellation_reason' => 'Ada acara keluarga mendadak.',
            'refund_status' => 'tidak_berlaku',
        ]);

        $this->command->info('Data dummy: 5 mentee dan 7 skenario booking berhasil dibuat.');
    }
}
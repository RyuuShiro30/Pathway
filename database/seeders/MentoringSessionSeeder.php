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

        // Bikin mentee dummy kalau belum ada
        $mentee = User::firstOrCreate(
            ['email' => 'mentee@example.com'],
            [
                'name' => 'Budi Mentee',
                'password' => Hash::make('password'),
            ]
        );

        // Booking contoh: sesi gratis, status diajukan
        MentoringSession::create([
            'student_id' => $mentee->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => now()->addDays(2)->setTime(10, 0),
            'end_time' => now()->addDays(2)->setTime(11, 0),
            'duration_hours' => 1,
            'notes_from_student' => 'Mau tanya-tanya soal dasar React dan cara mulai belajar frontend development dari nol.',
            'is_free_session' => true,
            'price_snapshot' => 0,
            'payment_dp_status' => 'tidak_berlaku',
        ]);

        // Booking contoh: sesi berbayar 2 jam, status diajukan
        MentoringSession::create([
            'student_id' => $mentee->id,
            'mentor_id' => $mentor->id,
            'status' => 'diajukan',
            'schedule_time' => now()->addDays(3)->setTime(14, 0),
            'end_time' => now()->addDays(3)->setTime(16, 0),
            'duration_hours' => 2,
            'notes_from_student' => 'Butuh review arsitektur project akhir, terutama bagian database design.',
            'is_free_session' => false,
            'price_snapshot' => 100000,
            'payment_dp_status' => 'menunggu_verifikasi',
        ]);

        $this->command->info('Data dummy mentee dan booking berhasil dibuat.');
    }
}
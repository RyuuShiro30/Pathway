<?php

namespace Database\Seeders;

use App\Models\MentoringSession;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ReviewModerationSeeder extends Seeder
{
    public function run(): void
    {
        $mainMentor = User::query()->where('email', 'mentor@test.com')->first();
        $mainStudent = User::query()->where('email', 'murid@test.com')->first();

        if (! $mainMentor || ! $mainStudent) {
            $this->command?->warn(
                'ReviewModerationSeeder dilewati karena akun demo belum tersedia.'
            );

            return;
        }

        $now = Carbon::now();

        $pendingSession = $this->upsertSession($mainStudent, $mainMentor, [
            'notes_from_student' => 'SKENARIO-34: Konsultasi struktur proyek Laravel (Ulasan Menunggu Moderasi)',
            'schedule_time' => $now->copy()->subDays(6)->setTime(13, 0),
            'end_time' => $now->copy()->subDays(6)->setTime(14, 0),
            'notes_from_mentor' => 'Diskusi struktur folder dan pemisahan tanggung jawab kelas.',
            'proof_file' => 'session-proofs/sample-session.png',
        ]);

        Review::query()->updateOrCreate(
            ['session_id' => $pendingSession->id],
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'rating' => 4,
                'feedback' => 'Penjelasan terstruktur dan mudah diikuti, meskipun sesi terasa singkat.',
                'status' => Review::STATUS_MENUNGGU,
                'moderation_note' => null,
            ]
        );

        $rejectedSession = $this->upsertSession($mainStudent, $mainMentor, [
            'notes_from_student' => 'SKENARIO-35: Review kode tugas akhir (Ulasan Ditolak Moderasi)',
            'schedule_time' => $now->copy()->subDays(7)->setTime(15, 0),
            'end_time' => $now->copy()->subDays(7)->setTime(16, 0),
            'notes_from_mentor' => 'Pembahasan kualitas kode dan perbaikan query database.',
            'proof_file' => 'session-proofs/sample-session.png',
        ]);

        Review::query()->updateOrCreate(
            ['session_id' => $rejectedSession->id],
            [
                'student_id' => $mainStudent->id,
                'mentor_id' => $mainMentor->id,
                'rating' => 2,
                'feedback' => 'Ulasan ini ditolak karena mengandung kata yang tidak pantas.',
                'status' => Review::STATUS_DITOLAK,
                'moderation_note' => 'Ulasan mengandung ujaran kasar sehingga tidak dapat ditampilkan.',
            ]
        );
    }

    private function upsertSession(
        User $student,
        User $mentor,
        array $attributes
    ): MentoringSession {
        return MentoringSession::query()->updateOrCreate(
            [
                'student_id' => $student->id,
                'mentor_id' => $mentor->id,
                'notes_from_student' => $attributes['notes_from_student'],
            ],
            array_merge([
                'status' => 'selesai',
                'duration_hours' => 1,
                'is_free_session' => true,
                'price_snapshot' => 0,
                'payment_dp_status' => 'tidak_berlaku',
            ], $attributes)
        );
    }
}

<?php

namespace Database\Seeders;

use App\Models\Journey;
use App\Models\JourneyBookmark;
use App\Models\JourneyComment;
use App\Models\JourneyLike;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class JourneySeeder extends Seeder
{
    public function run(): void
    {
        $mainStudent = User::query()->where('email', 'murid@test.com')->first();
        $mainMentor = User::query()->where('email', 'mentor@test.com')->first();
        $testUser = User::query()->where('email', 'test@example.com')->first();

        if (! $mainStudent || ! $mainMentor || ! $testUser) {
            $this->command?->warn(
                'JourneySeeder dilewati karena akun demo belum tersedia.'
            );

            return;
        }

        $studentJourney = $this->upsertJourney($mainStudent, [
            'title' => 'Dari Nol Belajar Laravel Hingga Mengerjakan Proyek Nyata',
            'status' => Journey::STATUS_PUBLISHED,
            'content' => <<<'MARKDOWN'
# Perjalanan Belajar Laravel

Awalnya saya merasa **Laravel** sangat rumit. Namun setelah rutin mengikuti sesi
mentoring, saya mulai memahami alur kerja framework ini.

## Yang saya pelajari

- Struktur proyek dan konsep MVC
- Relasi Eloquent dan migration
- Pengujian fitur dengan PHPUnit
- Deployment ke hosting

## Tips untuk pemula

1. Mulai dari proyek kecil yang benar-benar ingin kamu selesaikan.
2. Jangan ragu bertanya di sesi mentoring.
3. Dokumentasikan setiap kesalahan yang pernah kamu temui.

Cerita lengkapnya bisa dibaca di [roadmap belajar](https://roadmap.sh/laravel).

> Konsistensi belajar setiap hari jauh lebih penting daripada belajar keras
> hanya sekali dalam seminggu.
MARKDOWN,
        ]);

        $this->upsertJourney($mainStudent, [
            'title' => 'Pengalaman Mengikuti Sesi Mentoring Pertama',
            'status' => Journey::STATUS_MENUNGGU,
            'content' => <<<'MARKDOWN'
Sesi mentoring pertama saya membahas persiapan karier sebagai *backend developer*.

Mentor membantu saya menyusun rencana belajar dan menunjukkan portofolio seperti apa
yang perlu saya siapkan sebelum melamar magang.
MARKDOWN,
        ]);

        $this->upsertJourney($mainStudent, [
            'title' => 'Draft Rencana Belajar Backend Selama Enam Bulan',
            'status' => Journey::STATUS_DRAFT,
            'content' => <<<'MARKDOWN'
Draft ini masih saya susun dan akan saya rapikan sebelum dibagikan ke komunitas.

- Bulan 1: dasar PHP dan Git
- Bulan 2: Laravel dan basis data
- Bulan 3: pengujian dan deployment
MARKDOWN,
        ]);

        $this->upsertJourney($mainMentor, [
            'title' => 'Tips Memilih Mentor yang Tepat untuk Perjalanan Belajarmu',
            'status' => Journey::STATUS_PUBLISHED,
            'allow_comments' => false,
            'content' => <<<'MARKDOWN'
Memilih mentor bukan sekadar mencari yang paling berpengalaman. Perhatikan apakah
tujuan belajarmu sejalan dengan keahlian mentor tersebut.

## Pertanyaan yang bisa kamu ajukan

- Bagaimana pengalaman mentor menghadapi masalah seperti milikmu?
- Seberapa sering mentor memberikan umpan balik terhadap pekerjaanmu?
- Apakah gaya komunikasinya cocok dengan cara belajarmu?
MARKDOWN,
        ]);

        $this->upsertJourney($testUser, [
            'title' => 'Promosi Kelas Online Unggulan',
            'status' => Journey::STATUS_DITOLAK,
            'moderation_note' => 'Cerita mengandung promosi berbayar tanpa konteks pengalaman belajar.',
            'content' => 'Ikuti kelas online eksklusif dengan diskon terbatas minggu ini saja.',
        ]);

        JourneyLike::query()->firstOrCreate([
            'journey_id' => $studentJourney->id,
            'user_id' => $mainMentor->id,
        ]);

        JourneyLike::query()->firstOrCreate([
            'journey_id' => $studentJourney->id,
            'user_id' => $testUser->id,
        ]);

        JourneyBookmark::query()->firstOrCreate([
            'journey_id' => $studentJourney->id,
            'user_id' => $testUser->id,
        ]);

        JourneyComment::query()->firstOrCreate([
            'journey_id' => $studentJourney->id,
            'user_id' => $testUser->id,
            'body' => 'Terima kasih sudah berbagi pengalaman, sangat membantu pemula seperti saya.',
        ]);

        $studentJourney->forceFill([
            'likes_count' => JourneyLike::query()
                ->where('journey_id', $studentJourney->id)
                ->count(),
        ])->save();
    }

    private function upsertJourney(User $author, array $attributes): Journey
    {
        $slug = Str::slug($attributes['title']);

        return Journey::query()->updateOrCreate(
            ['slug' => $slug],
            array_merge([
                'author_id' => $author->id,
                'allow_comments' => true,
                'moderation_note' => null,
            ], $attributes)
        );
    }
}

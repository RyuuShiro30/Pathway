<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Course; // Kita gunakan Model Course

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $courses = [
            [
                'title' => 'UI/UX Design Dasar',
                'description' => 'Belajar dasar-dasar desain antarmuka dan pengalaman pengguna dari awal hingga membuat prototipe di Figma.',
                'level' => 'beginner',
                'is_published' => true,
            ],
            [
                'title' => 'Pemrograman Laravel 11 untuk Pemula',
                'description' => 'Menguasai framework Laravel terbaru untuk membangun aplikasi web yang cepat, aman, dan scalable.',
                'level' => 'beginner',
                'is_published' => true,
            ],
            [
                'title' => 'Dasar Pemrograman Python',
                'description' => 'Pelajari dasar-dasar pemrograman Python dari nol hingga menengah. Cocok untuk pemula yang ingin memulai karir di Data Science, Web Development, atau AI.',
                'level' => 'beginner',
                'is_published' => true,
            ],
        ];

        foreach ($courses as $course) {
            // Gunakan updateOrCreate agar tidak error jika data sudah ada
            Course::updateOrCreate(
                ['slug' => Str::slug($course['title'])], // Kunci pencarian
                [
                    'title' => $course['title'],
                    'description' => $course['description'],
                    'level' => $course['level'],
                    'is_published' => $course['is_published'],
                ]
            );
        }
    }
}
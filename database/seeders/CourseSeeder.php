<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        ];

        foreach ($courses as $course) {
            DB::table('courses')->insert([
                'title' => $course['title'],
                'slug' => Str::slug($course['title']),
                'description' => $course['description'],
                'level' => $course['level'],
                'is_published' => $course['is_published'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
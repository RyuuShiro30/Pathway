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
                'instructor' => 'Siti Rahma',
                'category' => 'Design',
                'is_published' => true,
            ],
            [
                'title' => 'Pemrograman Laravel 11 untuk Pemula',
                'description' => 'Menguasai framework Laravel terbaru untuk membangun aplikasi web yang cepat, aman, dan scalable.',
                'instructor' => 'Andi Pratama',
                'category' => 'Web Development',
                'is_published' => true,
            ],
        ];

        foreach ($courses as $course) {
            DB::table('courses')->insert([
                'title' => $course['title'],
                'slug' => Str::slug($course['title']),
                'description' => $course['description'],
                'instructor' => $course['instructor'],
                'category' => $course['category'],
                'is_published' => $course['is_published'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
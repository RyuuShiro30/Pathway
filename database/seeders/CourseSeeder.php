<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use Illuminate\Support\Str;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $courses = [
            [
                'title' => 'UI/UX Design Dasar',
                'slug' => Str::slug('UI/UX Design Dasar'),
                'description' => 'Pelajari konsep dasar UI/UX, wireframing, dan prototyping menggunakan Figma untuk pemula.',
                'level' => 'beginner', 
                'is_published' => true,
            ],
            [
                'title' => 'Backend Dasar dengan Laravel',
                'slug' => Str::slug('Backend Dasar dengan Laravel'),
                'description' => 'Kuasai pondasi awal pembuatan API, relasi database, dan autentikasi dengan framework Laravel.',
                'level' => 'beginner',
                'is_published' => true,
            ],
            [
                'title' => 'Frontend Dasar React & Tailwind',
                'slug' => Str::slug('Frontend Dasar React & Tailwind'),
                'description' => 'Langkah awal membangun antarmuka web yang responsif dengan React.js dan Tailwind CSS.',
                'level' => 'beginner',
                'is_published' => true,
            ],
        ];

        foreach ($courses as $course) {
            Course::create($course);
        }
    }
}
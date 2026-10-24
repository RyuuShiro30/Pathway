<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourseMaterialSeeder extends Seeder
{
    public function run(): void
    {
        // Cari ID course "UI/UX Design Dasar" yang baru saja dimasukkan
        $uiuxCourse = DB::table('courses')->where('title', 'UI/UX Design Dasar')->first();

        if ($uiuxCourse) {
            $materials = [
                [
                    'course_id' => $uiuxCourse->id,
                    'section_name' => 'Bagian 1: Pengantar',
                    'title' => 'Pendahuluan UI/UX Design',
                    'content_body' => '<p>Halo! Selamat datang di course <strong>UI/UX Design Dasar</strong>.</p><p>UI (User Interface) adalah tampilan visual, sedangkan UX (User Experience) adalah pengalaman pengguna saat berinteraksi dengan produk.</p>',
                    'sequence_order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'course_id' => $uiuxCourse->id,
                    'section_name' => 'Bagian 1: Pengantar',
                    'title' => 'Prinsip Dasar Layout',
                    'content_body' => '<p>Layout yang baik adalah kunci dari desain yang mudah digunakan.</p><ul><li>Gunakan Grid System</li><li>Perhatikan White Space</li></ul>',
                    'sequence_order' => 2,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'course_id' => $uiuxCourse->id,
                    'section_name' => 'Bagian 2: Praktik',
                    'title' => 'Wireframing di Figma',
                    'content_body' => '<p>Wireframe adalah kerangka kasar dari sebuah desain web atau aplikasi di Figma.</p>',
                    'sequence_order' => 3,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ];

            DB::table('course_materials')->insert($materials);
        }
    }
}
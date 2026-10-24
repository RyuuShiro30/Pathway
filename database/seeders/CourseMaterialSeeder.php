<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\CourseMaterial;

class CourseMaterialSeeder extends Seeder
{
    public function run(): void
    {
        // Cari Course UI/UX
        $uiux = Course::where('title', 'UI/UX Design Dasar')->first();
        
        if ($uiux) {
            $uiuxMaterials = [
                [
                    'section_name' => 'Bagian 1: Pengantar',
                    'title' => 'Pendahuluan UI/UX Design',
                    'content_body' => '<p>Halo! Selamat datang di course <strong>UI/UX Design Dasar</strong>.</p><p>UI (User Interface) adalah tampilan visual, sedangkan UX (User Experience) adalah pengalaman pengguna saat berinteraksi dengan produk. Di sini kita akan belajar keduanya!</p>',
                    'sequence_order' => 1,
                ],
                [
                    'section_name' => 'Bagian 1: Pengantar',
                    'title' => 'Prinsip Dasar Layout',
                    'content_body' => '<p>Layout yang baik adalah kunci dari desain yang mudah digunakan.</p><ul><li>Gunakan Grid System</li><li>Perhatikan White Space (ruang kosong)</li><li>Hierarki visual harus jelas</li></ul>',
                    'sequence_order' => 2,
                ],
                [
                    'section_name' => 'Bagian 2: Praktik',
                    'title' => 'Wireframing di Figma',
                    'content_body' => '<p>Wireframe adalah kerangka kasar dari sebuah desain web atau aplikasi.</p><p>Mari kita buka Figma dan mulai membuat kotak-kotak sederhana untuk memetakan penempatan tombol dan gambar.</p>',
                    'sequence_order' => 3,
                ],
            ];

            foreach ($uiuxMaterials as $material) {
                $uiux->courseMaterials()->create($material);
            }
        }
    }
}
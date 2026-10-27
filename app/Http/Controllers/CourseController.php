<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\UserEnrollment;
use App\Models\UserProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index()
    {
        // Ambil semua course yang sudah di-publish
        $courses = Course::where('is_published', true)->latest()->get();

        // Lempar datanya ke file resources/js/Pages/Course/Courses.jsx
        return Inertia::render('Course/Courses', [
            'courses' => $courses
        ]);
    }

    public function show(string $slug)
    {
        $course = Course::with('courseMaterials')->where('slug', $slug)->firstOrFail(); 
        
        return Inertia::render('Course/Window', [
            'course' => $course,
            'materials' => $course->courseMaterials
        ]);
    }

    // Ruang Baca Materi (File Show.jsx)
    public function learn(string $slug)
    {
        $course = Course::with('courseMaterials')->where('slug', $slug)->firstOrFail(); 
        $user = Auth::user();

        // 1. Otomatis buat data Enrollment jika user baru pertama kali masuk kelas
        $enrollment = UserEnrollment::firstOrCreate([
            'user_id' => $user->id,
            'course_id' => $course->id
        ], [
            'status' => 'in_progress',
            'progress_percentage' => 0,
            'enrolled_at' => now()
        ]);

        // 2. Ambil ID materi yang sudah pernah dicentang selesai oleh user dari tabel user_progress
        $completedMaterialIds = $enrollment->userProgress()
            ->where('is_completed', true)
            ->pluck('material_id')
            ->toArray();

        // 3. Sisipkan properti is_completed ke setiap item materi
        $materials = $course->courseMaterials->map(function ($material) use ($completedMaterialIds) {
            $material->is_completed = in_array($material->id, $completedMaterialIds);
            return $material;
        });

        return Inertia::render('Course/Show', [
            'course' => $course,
            'materials' => $materials,
            'dbProgress' => (float) $enrollment->progress_percentage
        ]);
    }

    // Memproses penyimpan modul selesai dari tombol "Selesai & Lanjut"
    public function markAsCompleted(Request $request, string $slug, $materialId)
    {
        $course = Course::where('slug', $slug)->firstOrFail();
        $user = Auth::user();

        // 1. Ambil enrollment user di course ini
        $enrollment = UserEnrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->firstOrFail();

        // 2. Catat progress modul ke tabel user_progress
        UserProgress::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id, 
                'material_id' => $materialId
            ],
            [
                'is_completed' => true, 
                'completed_at' => now()
            ]
        );

        // 3. Hitung persentase progres terbaru
        $totalMaterials = $course->courseMaterials()->count();
        $completedCount = $enrollment->userProgress()->where('is_completed', true)->count();
        
        $percentage = $totalMaterials > 0 ? round(($completedCount / $totalMaterials) * 100, 2) : 0;
        $isFinished = $percentage >= 100;

        // 4. Update persentase dan status di tabel user_enrollments
        $enrollment->update([
            'progress_percentage' => $percentage,
            'status' => $isFinished ? 'completed' : 'in_progress',
            'completed_at' => $isFinished ? now() : $enrollment->completed_at
        ]);

        return back();
    }
}
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
        // Hanya tampilkan course yang berstatus Published
        $courses = Course::where('is_published', true)->latest()->get();

        return Inertia::render('Course/Courses', [
            'courses' => $courses,
        ]);
    }

    public function show(string $slug)
    {
        $course = Course::where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $materials = $course->courseMaterials()->paginate(5);

        return Inertia::render('Course/Window', [
            'course' => $course,
            'materials' => $materials,
        ]);
    }

    public function learn(string $slug)
    {
        $course = Course::with('courseMaterials')
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $user = Auth::user();

        $enrollment = UserEnrollment::firstOrCreate([
            'user_id' => $user->id,
            'course_id' => $course->id,
        ], [
            'status' => 'in_progress',
            'progress_percentage' => 0,
            'enrolled_at' => now(),
        ]);

        $completedMaterialIds = $enrollment->userProgress()
            ->where('is_completed', true)
            ->pluck('material_id')
            ->toArray();

        $materials = $course->courseMaterials->map(function ($material) use ($completedMaterialIds) {
            $material->is_completed = in_array($material->id, $completedMaterialIds);
            return $material;
        });

        return Inertia::render('Course/Show', [
            'course' => $course,
            'materials' => $materials,
            'dbProgress' => (float) $enrollment->progress_percentage,
        ]);
    }

    public function markAsCompleted(Request $request, string $slug, $materialId)
    {
        $course = Course::where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $user = Auth::user();

        $enrollment = UserEnrollment::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->firstOrFail();

        UserProgress::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'material_id' => $materialId,
            ],
            [
                'is_completed' => true,
                'completed_at' => now(),
            ]
        );

        $totalMaterials = $course->courseMaterials()->count();
        $completedCount = $enrollment->userProgress()->where('is_completed', true)->count();

        $percentage = $totalMaterials > 0 ? round(($completedCount / $totalMaterials) * 100, 2) : 0;
        $isFinished = $percentage >= 100;

        $enrollment->update([
            'progress_percentage' => $percentage,
            'status' => $isFinished ? 'completed' : 'in_progress',
            'completed_at' => $isFinished ? now() : $enrollment->completed_at,
        ]);

        return back();
    }
}
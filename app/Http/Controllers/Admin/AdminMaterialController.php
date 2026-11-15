<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseMaterial;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminMaterialController extends Controller
{
    public function index(Course $course)
    {
        $materials = $course->courseMaterials()->get();

        return Inertia::render('Admin/Material/Index', [
            'course' => $course,
            'materials' => $materials,
        ]);
    }

    public function create(Course $course)
    {
        $nextOrder = ($course->courseMaterials()->max('sequence_order') ?? 0) + 1;

        return Inertia::render('Admin/Material/Create', [
            'course' => $course,
            'existingSections' => $this->getExistingSections($course),
            'nextOrder' => $nextOrder,
        ]);
    }

    public function store(Request $request, Course $course)
    {
        $validated = $request->validate([
            'section_name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'video_url' => 'nullable|url',
            'sequence_order' => 'required|integer|min:1',
        ]);

        $course->courseMaterials()->create($validated);

        return redirect()->route('admin.courses.materials.index', $course->id);
    }

    public function edit(CourseMaterial $material)
    {
        $course = $material->course;

        return Inertia::render('Admin/Material/Edit', [
            'course' => $course,
            'material' => [
                'id' => $material->id,
                'section_name' => $material->section_name,
                'title' => $material->title,
                'content' => $material->content ?? $material->content_body ?? '',
                'video_url' => $material->video_url ?? $material->content_url ?? '',
                'sequence_order' => $material->sequence_order,
            ],
            'existingSections' => $this->getExistingSections($course),
        ]);
    }

    public function update(Request $request, CourseMaterial $material)
    {
        $validated = $request->validate([
            'section_name' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'video_url' => 'nullable|url',
            'sequence_order' => 'required|integer|min:1',
        ]);

        $material->update($validated);

        return redirect()->route('admin.courses.materials.index', $material->course_id);
    }

    public function destroy(CourseMaterial $material)
    {
        $courseId = $material->course_id;
        $material->delete();

        return redirect()->route('admin.courses.materials.index', $courseId);
    }

    private function getExistingSections(Course $course): array
    {
        return $course->courseMaterials()
            ->whereNotNull('section_name')
            ->where('section_name', '!=', '')
            ->distinct()
            ->pluck('section_name')
            ->values()
            ->toArray();
    }
}
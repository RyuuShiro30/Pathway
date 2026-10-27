<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminMaterialController extends Controller
{
    // Menampilkan daftar materi di dalam suatu course
    public function index(Course $course)
    {
        $materials = $course->courseMaterials()->get();

        return Inertia::render('Admin/Material/Index', [
            'course' => $course,
            'materials' => $materials,
        ]);
    }

    // Menampilkan form tambah materi
    public function create(Course $course)
    {
        return Inertia::render('Admin/Material/Create', [
            'course' => $course,
        ]);
    }

    // Menyimpan data materi baru ke database
    public function store(Request $request, Course $course)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'video_url' => 'nullable|url',
            'sequence_order' => 'required|integer',
        ]);

        $course->courseMaterials()->create([
            'title' => $request->input('title'),
            'content' => $request->input('content'),
            'video_url' => $request->input('video_url'),
            'sequence_order' => $request->input('sequence_order'),
        ]);

        return redirect()->route('admin.courses.materials.index', $course->id);
    }
}
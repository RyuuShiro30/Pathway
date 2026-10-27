<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AdminCourseController extends Controller
{
    public function index()
    {
        $courses = Course::latest()->get();

        return Inertia::render('Admin/Course/Index', [
            'courses' => $courses,
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Course/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'level' => 'required|in:beginner,intermediate,advanced',
            'is_published' => 'boolean',
        ]);

        Course::create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']) . '-' . uniqid(),
            'description' => $validated['description'],
            'level' => $validated['level'],
            'is_published' => $validated['is_published'] ?? false,
        ]);

        return redirect()->route('admin.courses.index');
    }

    public function edit(Course $course)
    {
        return Inertia::render('Admin/Course/Edit', [
            'course' => $course,
        ]);
    }

    public function update(Request $request, Course $course)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'level' => 'required|in:beginner,intermediate,advanced',
            'is_published' => 'boolean',
        ]);

        $course->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'level' => $validated['level'],
            'is_published' => $validated['is_published'] ?? false,
        ]);

        return redirect()->route('admin.courses.index');
    }

    public function destroy(Course $course)
    {
        $course->delete();

        return redirect()->route('admin.courses.index');
    }
}
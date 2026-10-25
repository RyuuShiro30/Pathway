<?php

namespace App\Http\Controllers;

use App\Models\Course;
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

    // Ruang Baca Materi (File Show.jsx lamamu)
    public function learn(string $slug)
    {
        $course = Course::with('courseMaterials')->where('slug', $slug)->firstOrFail(); 
        return Inertia::render('Course/Show', [
            'course' => $course,
            'materials' => $course->courseMaterials
        ]);
    }
}
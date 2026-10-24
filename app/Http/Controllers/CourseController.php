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
}
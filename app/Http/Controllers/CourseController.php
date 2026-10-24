<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index()
    {
        // Tarik semua data course dari database
        $courses = Course::latest()->get();

        // Lempar data ke halaman React
        return Inertia::render('Course/Index', [
            'courses' => $courses
        ]);
    }
}
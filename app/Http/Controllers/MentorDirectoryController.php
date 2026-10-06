<?php

namespace App\Http\Controllers;

use App\Models\MentorProfile;
use Inertia\Inertia;

class MentorDirectoryController extends Controller
{
    public function index()
    {
        $mentors = MentorProfile::with('user')
            ->where('verification_status', 'verified')
            ->get();

        return Inertia::render('Mentors/Index', [
            'mentors' => $mentors,
        ]);
    }
}
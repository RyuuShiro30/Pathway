<?php

namespace App\Http\Controllers;

use App\Models\MentorProfile;
use Illuminate\Http\Request;

class MentorDirectoryController extends Controller
{
    public function index()
    {
        $mentors = MentorProfile::with('user')
            ->where('verification_status', 'verified')
            ->get();

        return response()->json($mentors);
    }
}
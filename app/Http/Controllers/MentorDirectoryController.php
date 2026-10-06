<?php

namespace App\Http\Controllers;

use App\Models\MentorProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MentorDirectoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $mentors = MentorProfile::with('user')
            ->where('verification_status', 'verified')
            ->when($search, function ($query) use ($search) {
                $query->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', '%' . $search . '%');
                });
            })
            ->get();

        return Inertia::render('Mentors/Index', [
            'mentors' => $mentors,
            'search' => $search,
        ]);
    }
}
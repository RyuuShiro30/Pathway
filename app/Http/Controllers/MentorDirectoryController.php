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
        $expertise = $request->input('expertise');
        $availability = $request->input('availability');
        $mentorType = $request->input('mentor_type');

        $mentors = MentorProfile::with('user')
            ->where('verification_status', 'verified')
            ->when($search, function ($query) use ($search) {
                $query->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->whereRaw(
                        'LOWER(name) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    );
                });
            })
            ->when($expertise, function ($query) use ($expertise) {
                $query->where('expertise', $expertise);
            })
            ->when(
                $availability !== null && $availability !== '',
                function ($query) use ($availability) {
                    $query->where('is_available', $availability);
                }
            )
            ->when($mentorType, function ($query) use ($mentorType) {
                $query->where('mentor_type', $mentorType);
            })
            ->get();

        $expertises = MentorProfile::where('verification_status', 'verified')
            ->select('expertise')
            ->distinct()
            ->orderBy('expertise')
            ->pluck('expertise');

        return Inertia::render('Mentors/Index', [
            'mentors' => $mentors,
            'search' => $search,
            'expertise' => $expertise,
            'expertises' => $expertises,
            'availability' => $availability,
            'mentorType' => $mentorType,
        ]);
    }
}
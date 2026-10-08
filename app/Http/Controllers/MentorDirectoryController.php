<?php

namespace App\Http\Controllers;

use App\Models\MentorProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MentorDirectoryController extends Controller
{
    // Menampilkan daftar mentor dan filter
    public function index(Request $request)
    {
        $search = $request->input('search');
        $expertise = $request->input('expertise');
        $availability = $request->input('availability');
        $mentorType = $request->input('mentor_type');

        $mentors = MentorProfile::with('user')
            ->where('verification_status', 'verified')

            // Pencarian berdasarkan nama mentor
            ->when($search, function ($query) use ($search) {
                $query->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->whereRaw(
                        'LOWER(name) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    );
                });
            })

            // Filter berdasarkan expertise
            ->when($expertise, function ($query) use ($expertise) {
                $query->where('expertise', $expertise);
            })

            // Filter berdasarkan ketersediaan
            ->when(
                $availability !== null && $availability !== '',
                function ($query) use ($availability) {
                    $query->where('is_available', $availability);
                }
            )

            // Filter berdasarkan jenis mentoring
            ->when($mentorType, function ($query) use ($mentorType) {
                $query->where('mentor_type', $mentorType);
            })
            ->get();

        // Mengambil daftar expertise yang tersedia
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

    // Menampilkan detail mentor
    public function show($id)
    {
        $mentor = MentorProfile::with('user')
            ->where('verification_status', 'verified')
            ->findOrFail($id);

        return Inertia::render('Mentors/Show', [
            'mentor' => $mentor,
        ]);
    }
}
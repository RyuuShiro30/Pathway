<?php

namespace App\Http\Controllers;

use App\Models\MentorProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MentorProfileController extends Controller
{
    // GET - ambil profil mentor yang sedang login
    public function show()
    {
        $mentorProfile = MentorProfile::where('user_id', Auth::id())->first();

        if (!$mentorProfile) {
            return response()->json([
                'message' => 'Profil mentor belum ditemukan'
            ], 404);
        }

        return response()->json($mentorProfile);
    }

    // PATCH - update jadwal ketersediaan mentor
    public function updateAvailability(Request $request)
    {
        $request->validate([
            'availability_schedule' => 'required|array',
            'availability_schedule.*.day' => 'required|string',
            'availability_schedule.*.start' => 'required|date_format:H:i',
            'availability_schedule.*.end' => 'required|date_format:H:i|after:availability_schedule.*.start',
        ]);

        $mentorProfile = MentorProfile::where('user_id', Auth::id())->first();

        if (!$mentorProfile) {
            return response()->json([
                'message' => 'Profil mentor belum ditemukan'
            ], 404);
        }

        $mentorProfile->update([
            'availability_schedule' => $request->availability_schedule,
        ]);

        return response()->json([
            'message' => 'Jadwal ketersediaan berhasil diperbarui',
            'data' => $mentorProfile,
        ]);
    }
}
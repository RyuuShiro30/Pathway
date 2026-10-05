<?php

namespace App\Http\Controllers;

use App\Models\MentorProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MentorProfileController extends Controller
{
    // Buka halaman Dashboard Mentor
    public function dashboard()
    {
        $mentorProfile = MentorProfile::where('user_id', Auth::id())->first();

        $requests = \App\Models\MentoringSession::with('student')
            ->where('mentor_id', Auth::id())
            ->where('status', 'diajukan')
            ->orderBy('schedule_time', 'asc')
            ->get();

        return Inertia::render('Mentor/Dashboard', [
            'mentorProfile' => $mentorProfile,
            'bookingRequests' => $requests,
        ]);
    }

    // Aksi: update jadwal ketersediaan (dipanggil saat mentor klik "Simpan")
    public function updateAvailability(Request $request)
    {
        $request->validate([
            'availability_schedule' => 'present|array',
            'availability_schedule.*.day' => 'required|string',
            'availability_schedule.*.start' => 'required|date_format:H:i',
            'availability_schedule.*.end' => 'required|date_format:H:i|after:availability_schedule.*.start',
        ]);

        $mentorProfile = MentorProfile::where('user_id', Auth::id())->first();

        if (!$mentorProfile) {
            return redirect()->back()->withErrors(['message' => 'Profil mentor belum ditemukan']);
        }

        $mentorProfile->update([
            'availability_schedule' => $request->availability_schedule,
        ]);

        return redirect()->back()->with('success', 'Jadwal ketersediaan berhasil diperbarui');
    }
}
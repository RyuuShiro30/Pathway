<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Models\UserEnrollment;
use App\Models\MentoringSession;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // 1. Course yang sedang dipelajari
        $activeCourses = UserEnrollment::with('course')
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->get();

        // 2. Jadwal bimbingan terdekat yang belum selesai
        $lastBooking = MentoringSession::with('mentor')
            ->where('student_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('schedule_time', 'asc')
            ->first();

        // 3. Semua course milik mahasiswa
        $myCourses = UserEnrollment::with('course')
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->get();

        // 4. Sesi mentoring yang selesai untuk fitur rating
        // Mengambil data mentor, profil mentor, dan ulasan
        $completedSessions = MentoringSession::with([
                'mentor.mentorProfile',
                'review',
            ])
            ->where('student_id', $user->id)
            ->where('status', 'selesai')
            ->orderBy('schedule_time', 'desc')
            ->get();

        // 5. Kirim semua data ke halaman Dashboard.jsx
        return Inertia::render('Dashboard', [
            'activeCourses' => $activeCourses,
            'lastBooking' => $lastBooking,
            'myCourses' => $myCourses,
            'completedSessions' => $completedSessions,
        ]);
    }
}

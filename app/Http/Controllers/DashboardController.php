<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Models\UserEnrollment;
use App\Models\MentoringSession;
use App\Models\UserProgress; // Tambahkan ini untuk menghitung modul selesai
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // ==========================================
        // 1. PERHITUNGAN METRIK STATISTIK DASHBOARD
        // ==========================================
        
        // Total Course yang sudah tamat (100%)
        $courseSelesaiCount = UserEnrollment::where('user_id', $user->id)
            ->where('status', 'completed')
            ->count();

        // Total Modul individual yang sudah diselesaikan (diklik Selesai & Lanjut)
        $modulSelesaiCount = UserProgress::whereHas('enrollment', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })->where('is_completed', true)->count();

        // Total Sesi Mentoring yang sudah berstatus selesai
        $sesiSelesaiCount = MentoringSession::where('student_id', $user->id)
            ->where('status', 'selesai')
            ->count();


        // ==========================================
        // 2. PENGAMBILAN DATA WIDGET KONTEN UTAMA
        // ==========================================

        // Course yang sedang dipelajari
        $activeCourses = UserEnrollment::with('course')
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->get();

        // Jadwal bimbingan terdekat yang belum selesai
        $lastBooking = MentoringSession::with('mentor')
            ->where('student_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('schedule_time', 'asc')
            ->first();

        // Semua course milik mahasiswa
        $myCourses = UserEnrollment::with('course')
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->get();

        // Sesi mentoring yang selesai untuk fitur rating
        $completedSessions = MentoringSession::with([
                'mentor.mentorProfile',
                'review',
            ])
            ->where('student_id', $user->id)
            ->where('status', 'selesai')
            ->orderBy('schedule_time', 'desc')
            ->get();

        // Kirim semua data ke halaman Dashboard.jsx
        return Inertia::render('Dashboard', [
            // Data Metrik Angka
            'courseSelesaiCount' => $courseSelesaiCount,
            'modulSelesaiCount'  => $modulSelesaiCount,
            'sesiSelesaiCount'   => $sesiSelesaiCount,
            
            // Data List/Array
            'activeCourses'      => $activeCourses,
            'lastBooking'        => $lastBooking,
            'myCourses'          => $myCourses,
            'completedSessions'  => $completedSessions,
        ]);
    }
}

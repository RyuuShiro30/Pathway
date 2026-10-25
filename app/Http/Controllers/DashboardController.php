<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\UserEnrollment;
use App\Models\MentoringSession;
use Inertia\Inertia; // Jangan lupa tambahkan baris use ini di atas

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // 1. Ambil course yang belum 100% selesai
        $activeCourses = UserEnrollment::with('course')
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->get();

        // 2. Ambil jadwal bimbingan terbaru (yang belum selesai)
        $lastBooking = MentoringSession::with('mentor')
            ->where('student_id', $user->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('schedule_time', 'asc')
            ->first();

        $myCourses = UserEnrollment::with('course')
            ->where('user_id', $user->id)
            ->orderBy('updated_at', 'desc')
            ->get();

        // Ubah return view menjadi Inertia::render untuk memanggil Dashboard.jsx
        return Inertia::render('Dashboard', [
            'activeCourses' => $activeCourses,
            'lastBooking' => $lastBooking,
            'myCourses' => $myCourses,
        ]);
    }
}
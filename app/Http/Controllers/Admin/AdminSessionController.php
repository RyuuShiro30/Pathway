<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MentoringSession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminSessionController extends Controller
{
    public function index(Request $request)
    {
        $statusFilter = $request->query('status', 'belum_selesai');

        $query = MentoringSession::with(['student', 'mentor.mentorProfile']);

        if ($statusFilter === 'belum_selesai') {
            $query->unresolved();
        } elseif ($statusFilter !== 'semua') {
            $query->where('status', $statusFilter);
        }

        $sessions = $query
            ->orderByRaw("CASE
                WHEN status = 'berlangsung' THEN 0
                WHEN status = 'dikonfirmasi' THEN 1
                ELSE 2
            END")
            ->orderBy('schedule_time')
            ->get()
            ->map(fn (MentoringSession $session) => [
                'id' => $session->id,
                'status' => $session->status,
                'schedule_time' => $session->schedule_time?->format('d M Y, H:i'),
                'end_time' => $session->end_time?->format('d M Y, H:i'),
                'duration_hours' => $session->duration_hours,
                'is_free_session' => (bool) $session->is_free_session,
                'price_snapshot' => $session->price_snapshot,
                'payment_dp_status' => $session->payment_dp_status,
                'refund_status' => $session->refund_status,
                'is_overdue' => $session->status !== 'selesai'
                    && $session->status !== 'dibatalkan'
                    && $session->end_time !== null
                    && $session->end_time->isPast(),
                'student' => [
                    'id' => $session->student?->id,
                    'name' => $session->student?->name ?? '-',
                    'email' => $session->student?->email ?? '-',
                ],
                'mentor' => [
                    'id' => $session->mentor?->id,
                    'name' => $session->mentor?->name ?? '-',
                    'email' => $session->mentor?->email ?? '-',
                    'is_suspended' => (bool) ($session->mentor?->mentorProfile?->is_suspended ?? false),
                ],
            ]);

        return Inertia::render('Admin/Session/Index', [
            'sessions' => $sessions,
            'currentStatus' => $statusFilter,
            'counts' => [
                'semua' => MentoringSession::count(),
                'belum_selesai' => MentoringSession::unresolved()->count(),
                'diajukan' => $this->countByStatus('diajukan'),
                'dikonfirmasi' => $this->countByStatus('dikonfirmasi'),
                'berlangsung' => $this->countByStatus('berlangsung'),
                'selesai' => $this->countByStatus('selesai'),
                'dibatalkan' => $this->countByStatus('dibatalkan'),
            ],
        ]);
    }

    private function countByStatus(string $status): int
    {
        return MentoringSession::where('status', $status)->count();
    }
}

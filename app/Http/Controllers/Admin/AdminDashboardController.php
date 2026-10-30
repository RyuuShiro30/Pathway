<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\MentorProfile;
use App\Models\MentorSuspension;
use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index()
    {
        // Statistik Utama
        $statistics = [
            'total_users' => User::count(),
            'total_mentors' => MentorProfile::count(),
            'total_courses' => Course::count(),
            'total_sessions' => MentoringSession::count(),
        ];

        // Antrean Perlu Ditinjau
        $reviewQueue = [
            'pending_mentors' => MentorProfile::where(
                'verification_status',
                'pending'
            )->count(),

            'refund_reports' => MentoringSession::where(
                'refund_status',
                'dilaporkan'
            )->count(),

            'no_show_disputes' => NoShowReport::where(
                'status',
                'disanggah'
            )->count(),

            'suspended_mentors' => MentorSuspension::active()->count(),
        ];

        // Monitoring
        $monitoring = [
            'active_mentors' => MentorProfile::where(
                'is_suspended',
                false
            )->count(),

            'suspended_mentors' => MentorProfile::where(
                'is_suspended',
                true
            )->count(),

            'total_sessions' => MentoringSession::count(),

            'average_rating' => round(
                MentorProfile::whereNotNull('avg_rating')
                    ->avg('avg_rating') ?? 0,
                2
            ),

            'points_circulating' => DB::table('point_transactions')
                ->selectRaw("
                    COALESCE(
                        SUM(
                            CASE
                                WHEN transaction_type IN ('earned_mentoring', 'admin_bonus')
                                    THEN amount
                                WHEN transaction_type = 'redeemed_badge'
                                    THEN -amount
                                ELSE 0
                            END
                        ),
                        0
                    ) as total
                ")
                ->value('total'),
        ];

        return Inertia::render('Admin/Dashboard', [
            'statistics' => $statistics,
            'reviewQueue' => $reviewQueue,
            'monitoring' => $monitoring,
        ]);
    }
}
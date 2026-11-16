<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\MentorSuspension;
use App\Models\NoShowReport;
use App\Models\Review;
use App\Models\User;
use App\Services\MentorRatingService;
use App\Services\PointService;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index(
        MentorRatingService $ratingService,
        PointService $pointService
    ) {
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

            'unresolved_sessions' => MentoringSession::unresolved()->count(),

            'active_suspensions' => MentorSuspension::active()->count(),

            'pending_reviews' => Review::where(
                'status',
                Review::STATUS_MENUNGGU
            )->count(),

            'flagged_mentors' => $ratingService->flaggedMentors()->count(),
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

            'average_rating' => round(
                MentorProfile::whereNotNull('avg_rating')
                    ->avg('avg_rating') ?? 0,
                2
            ),

            'points_circulating' => $pointService->circulating(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'statistics' => $statistics,
            'reviewQueue' => $reviewQueue,
            'monitoring' => $monitoring,
        ]);
    }
}

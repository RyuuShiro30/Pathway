<?php

namespace App\Console\Commands;

use App\Models\MentoringSession;
use App\Models\MentorSuspension;
use App\Models\NoShowReport;
use App\Services\MentorSuspensionService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CheckMentorSuspensions extends Command
{
    private const NO_SHOW_LIMIT = 3;

    private const NO_SHOW_WINDOW_DAYS = 30;

    protected $signature = 'mentors:check-suspensions';

    protected $description = 'Suspend mentor yang telat refund lebih dari 48 jam atau punya 3 laporan no-show berlaku dalam 30 hari';

    public function handle(MentorSuspensionService $service): int
    {
        $lateRefund = $this->suspendForLateRefunds($service);
        $noShow = $this->suspendForRepeatedNoShow($service);

        $this->info("Cek suspend selesai: {$lateRefund} mentor disuspend karena telat refund, {$noShow} karena no-show berulang.");

        return self::SUCCESS;
    }

    private function suspendForLateRefunds(MentorSuspensionService $service): int
    {
        $sessions = MentoringSession::query()
            ->where('refund_status', 'menunggu')
            ->whereNotNull('refund_deadline')
            ->where('refund_deadline', '<', Carbon::now())
            ->whereNotExists(function ($query): void {
                $query->select(DB::raw(1))
                    ->from('mentor_suspensions')
                    ->whereColumn('mentor_suspensions.session_id', 'mentoring_sessions.id')
                    ->where('mentor_suspensions.reason', MentorSuspension::REASON_LATE_REFUND);
            })
            ->orderBy('refund_deadline')
            ->get(['id', 'mentor_id']);

        $count = 0;

        foreach ($sessions as $session) {
            $suspension = $service->suspend(
                (int) $session->mentor_id,
                MentorSuspension::REASON_LATE_REFUND,
                (int) $session->id,
                'Refund belum diunggah setelah batas 48 jam.',
            );

            if ($suspension !== null) {
                $count++;
            }
        }

        return $count;
    }

    private function suspendForRepeatedNoShow(MentorSuspensionService $service): int
    {
        $windowStart = Carbon::now()->subDays(self::NO_SHOW_WINDOW_DAYS);

        $mentorIds = $this->noShowQuery()
            ->where('no_show_reports.finalized_at', '>=', $windowStart)
            ->groupBy('no_show_reports.reported_user_id')
            ->havingRaw('count(*) >= ?', [self::NO_SHOW_LIMIT])
            ->pluck('no_show_reports.reported_user_id');

        $count = 0;

        foreach ($mentorIds as $mentorId) {
            $mentorId = (int) $mentorId;
            $countedFrom = $windowStart;

            $lastLift = MentorSuspension::query()
                ->where('mentor_id', $mentorId)
                ->where('reason', MentorSuspension::REASON_NO_SHOW)
                ->whereNotNull('lifted_at')
                ->max('lifted_at');

            if ($lastLift !== null) {
                $liftedAt = Carbon::parse($lastLift);

                if ($liftedAt->gt($countedFrom)) {
                    $countedFrom = $liftedAt;
                }
            }

            $validReports = $this->noShowQuery()
                ->where('no_show_reports.reported_user_id', $mentorId)
                ->where('no_show_reports.finalized_at', '>=', $countedFrom)
                ->count();

            if ($validReports < self::NO_SHOW_LIMIT) {
                continue;
            }

            $suspension = $service->suspend(
                $mentorId,
                MentorSuspension::REASON_NO_SHOW,
                null,
                self::NO_SHOW_LIMIT.' laporan no-show berlaku dalam '.self::NO_SHOW_WINDOW_DAYS.' hari.',
            );

            if ($suspension !== null) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Laporan no-show berlaku yang menimpa mentor sesi itu (bukan student).
     */
    private function noShowQuery(): Builder
    {
        return NoShowReport::query()
            ->join('mentoring_sessions', 'mentoring_sessions.id', '=', 'no_show_reports.session_id')
            ->whereColumn('mentoring_sessions.mentor_id', 'no_show_reports.reported_user_id')
            ->where('no_show_reports.status', 'berlaku');
    }
}

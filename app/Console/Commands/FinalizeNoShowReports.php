<?php

namespace App\Console\Commands;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class FinalizeNoShowReports extends Command
{
    private const REFUND_WINDOW_HOURS = 48;

    protected $signature = 'no-show:finalize';

    protected $description = 'Jalankan sanksi untuk laporan no-show yang tidak ditanggapi dalam 24 jam';

    public function handle(): int
    {
        $reportIds = NoShowReport::query()
            ->where('status', 'menunggu_respons')
            ->where('respond_deadline', '<=', Carbon::now())
            ->pluck('id');

        $appliedCount = 0;

        foreach ($reportIds as $reportId) {
            if ($this->finalize((int) $reportId)) {
                $appliedCount++;
            }
        }

        $this->info("No-show selesai: {$appliedCount} laporan berlaku dan sanksi dijalankan.");

        return self::SUCCESS;
    }

    private function finalize(int $reportId): bool
    {
        return DB::transaction(function () use ($reportId): bool {
            $report = NoShowReport::query()
                ->whereKey($reportId)
                ->where('status', 'menunggu_respons')
                ->lockForUpdate()
                ->first();

            // Sudah ditanggapi atau diproses di detik yang sama.
            if (! $report) {
                return false;
            }

            $now = Carbon::now();

            if ($report->respond_deadline->gt($now)) {
                return false;
            }

            $session = MentoringSession::query()
                ->whereKey($report->session_id)
                ->lockForUpdate()
                ->first();

            // Sesi sudah berubah (misalnya dibatalkan): laporan ditutup tanpa sanksi.
            if (! $session || $session->status !== 'dikonfirmasi') {
                $report->update([
                    'status' => 'tidak_berlaku',
                    'finalized_at' => $now,
                ]);

                return false;
            }

            if ((int) $report->reported_user_id === (int) $session->student_id) {
                $session->update([
                    'status' => 'dibatalkan',
                    'cancelled_by' => 'mentee',
                    'cancellation_reason' => 'Dibatalkan otomatis: laporan no-show terhadap student berlaku.',
                ]);
            } else {
                $cancellation = [
                    'status' => 'dibatalkan',
                    'cancelled_by' => 'mentor',
                    'cancellation_reason' => 'Dibatalkan otomatis: laporan no-show terhadap mentor berlaku.',
                ];

                if (! $session->is_free_session) {
                    $cancellation['refund_status'] = 'menunggu';
                    $cancellation['refund_deadline'] = $now->copy()->addHours(self::REFUND_WINDOW_HOURS);
                }

                $session->update($cancellation);
            }

            $report->update([
                'status' => 'berlaku',
                'finalized_at' => $now,
            ]);

            return true;
        });
    }
}

<?php

namespace App\Console\Commands;

use App\Models\NoShowReport;
use App\Services\NoShowSanctionService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class FinalizeNoShowReports extends Command
{
    protected $signature = 'no-show:finalize';

    protected $description = 'Jalankan sanksi untuk laporan no-show yang tidak ditanggapi dalam 24 jam';

    public function handle(NoShowSanctionService $sanctionService): int
    {
        $reportIds = NoShowReport::query()
            ->where('status', 'menunggu_respons')
            ->where('respond_deadline', '<=', Carbon::now())
            ->pluck('id');

        $appliedCount = 0;

        foreach ($reportIds as $reportId) {
            if ($this->finalize((int) $reportId, $sanctionService)) {
                $appliedCount++;
            }
        }

        $this->info("No-show selesai: {$appliedCount} laporan berlaku dan sanksi dijalankan.");

        return self::SUCCESS;
    }

    private function finalize(int $reportId, NoShowSanctionService $sanctionService): bool
    {
        return DB::transaction(function () use ($reportId, $sanctionService): bool {
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

            return $sanctionService->apply($report);
        });
    }
}

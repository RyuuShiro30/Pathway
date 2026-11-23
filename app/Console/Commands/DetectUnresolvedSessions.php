<?php

namespace App\Console\Commands;

use App\Models\MentoringSession;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('app:detect-unresolved-sessions')]
#[Description('Mendeteksi sesi mentoring yang belum terselesaikan')]
class DetectUnresolvedSessions extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $cutoff = now()->subHours(24);

        $sessions = MentoringSession::query()
            ->where('status', 'dikonfirmasi')
            ->whereNotNull('end_time')
            ->where('end_time', '<', $cutoff)
            ->whereDoesntHave('noShowReport')
            ->whereDoesntHave('unresolvedSessionCase')
            ->select('id')
            ->get();

        $created = 0;

        foreach ($sessions as $session) {
            $now = now();

            $inserted = DB::table('unresolved_session_cases')
                ->insertOrIgnore([
                    'mentoring_session_id' => $session->id,
                    'status' => 'perlu_ditinjau',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

            $created += $inserted;
        }

        $this->info("Berhasil mendeteksi {$created} kasus pemeriksaan baru.");

        return self::SUCCESS;
    }
}
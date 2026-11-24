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
    public function handle(): int
    {
        $cutoff = now()->subHours(24);

        $sessionIds = MentoringSession::query()
            ->where('status', 'dikonfirmasi')
            ->whereNotNull('end_time')
            ->where('end_time', '<', $cutoff)
            ->whereDoesntHave('noShowReport')
            ->whereDoesntHave('unresolvedSessionCase')
            ->pluck('id');

        $created = 0;

        foreach ($sessionIds as $sessionId) {
            $inserted = DB::transaction(function () use ($sessionId, $cutoff) {
                $session = MentoringSession::query()
                    ->whereKey($sessionId)
                    ->lockForUpdate()
                    ->first();

                if (!$session) {
                    return 0;
                }

                if (
                    $session->status !== 'dikonfirmasi' ||
                    !$session->end_time ||
                    $session->end_time >= $cutoff ||
                    $session->noShowReport()->exists() ||
                    $session->unresolvedSessionCase()->exists()
                ) {
                    return 0;
                }

                $now = now();

                return DB::table('unresolved_session_cases')
                    ->insertOrIgnore([
                        'mentoring_session_id' => $session->id,
                        'status' => 'perlu_ditinjau',
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
            });

            $created += $inserted;
        }

        $this->info(
            "Berhasil mendeteksi {$created} kasus pemeriksaan baru."
        );

        return self::SUCCESS;
    }
}
<?php

namespace App\Console\Commands;

use App\Models\MentoringSession;
use App\Notifications\SessionEvent;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AutoConfirmRefund extends Command
{
    protected $signature = 'refund:auto-confirm';
    protected $description = 'Otomatis menyelesaikan refund jika student tidak merespons lebih dari 48 jam.';

    public function handle()
    {
        $deadline = Carbon::now()->subHours(48);

        $sessions = MentoringSession::query()
            ->where('refund_status', 'menunggu_konfirmasi')
            ->whereNotNull('refund_proof_uploaded_at')
            ->where('refund_proof_uploaded_at', '<=', $deadline)
            ->get();

        if ($sessions->isEmpty()) {
            $this->info('Tidak ada refund yang perlu dikonfirmasi otomatis saat ini.');
            return;
        }

        $count = 0;

        DB::transaction(function () use ($sessions, &$count) {
            foreach ($sessions as $session) {
                $session->update([
                    'refund_status' => 'selesai',
                ]);

                if ($session->mentor) {
                    $session->mentor->notify(new SessionEvent(
                        'Refund otomatis dikonfirmasi oleh sistem karena Mentee tidak merespons dalam 48 jam.', 
                        '/mentor/dashboard'
                    ));
                }

                $count++;
            }
        });

        $this->info("Berhasil! Sebanyak {$count} transaksi refund telah dikonfirmasi otomatis menjadi selesai.");
    }
}
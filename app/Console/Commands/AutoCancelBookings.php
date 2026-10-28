<?php

namespace App\Console\Commands;

use App\Models\MentoringSession;
use App\Models\User;
use App\Notifications\SessionEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AutoCancelBookings extends Command
{
    /**
     * Mentor punya 24 jam untuk merespons pengajuan.
     */
    private const RESPONSE_WINDOW_HOURS = 24;

    /**
     * Batas waktu mentor mengembalikan DP setelah pembatalan.
     */
    private const REFUND_WINDOW_HOURS = 48;

    protected $signature = 'bookings:auto-cancel';

    protected $description = 'Batalkan otomatis pengajuan yang tidak direspons mentor 24 jam atau jadwal mulainya terlewat';

    public function handle(): int
    {
        $now = Carbon::now();
        $responseCutoff = $now->copy()->subHours(self::RESPONSE_WINDOW_HOURS);

        $candidateIds = MentoringSession::query()
            ->where('status', 'diajukan')
            ->where(function ($query) use ($now, $responseCutoff): void {
                $query->where('schedule_time', '<', $now)
                    ->orWhere('created_at', '<=', $responseCutoff);
            })
            ->pluck('id');

        $cancelledCount = 0;

        foreach ($candidateIds as $id) {
            if ($this->cancelIfStale((int) $id)) {
                $cancelledCount++;
            }
        }

        $this->info("Auto-cancel selesai: {$cancelledCount} pengajuan dibatalkan.");

        return self::SUCCESS;
    }

    private function cancelIfStale(int $id): bool
    {
        return DB::transaction(function () use ($id): bool {
            $session = MentoringSession::query()
                ->whereKey($id)
                ->where('status', 'diajukan')
                ->lockForUpdate()
                ->first();

            // Sudah diproses mentor atau student di detik yang sama.
            if (! $session) {
                return false;
            }

            $now = Carbon::now();
            $isScheduleOverdue = $session->schedule_time->lt($now);
            $isResponseExpired = $session->created_at->lte(
                $now->copy()->subHours(self::RESPONSE_WINDOW_HOURS),
            );

            if (! $isScheduleOverdue && ! $isResponseExpired) {
                return false;
            }

            $cancellation = [
                'status' => 'dibatalkan',
                'cancelled_by' => 'sistem',
                'cancellation_reason' => $isScheduleOverdue
                    ? 'Dibatalkan otomatis oleh sistem: jadwal sesi terlewat sebelum mentor merespons.'
                    : 'Dibatalkan otomatis oleh sistem: mentor tidak merespons dalam 24 jam.',
            ];

            if (! $session->is_free_session) {
                $cancellation['refund_status'] = 'menunggu';
                $cancellation['refund_deadline'] = $now->copy()->addHours(self::REFUND_WINDOW_HOURS);
            }

            $session->update($cancellation);

            User::query()->find($session->student_id)?->notify(new SessionEvent('Pengajuan booking dibatalkan otomatis karena tidak direspons mentor.', '/bookings'));
            User::query()->find($session->mentor_id)?->notify(new SessionEvent('Pengajuan booking dibatalkan otomatis karena tidak Anda respons.', '/mentor/dashboard'));

            return true;
        });
    }
}

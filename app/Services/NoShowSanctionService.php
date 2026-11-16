<?php

namespace App\Services;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use App\Models\User;
use App\Notifications\SessionEvent;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class NoShowSanctionService
{
    public const REFUND_WINDOW_HOURS = 48;

    /**
     * Terapkan sanksi atas laporan no-show yang berlaku.
     * Mengembalikan true jika sanksi diterapkan, false jika sesi sudah berubah (misal sudah dibatalkan).
     */
    public function apply(NoShowReport $report): bool
    {
        return DB::transaction(function () use ($report): bool {
            $now = Carbon::now();

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

            User::query()->find($session->student_id)?->notify(new SessionEvent('Laporan no-show berlaku. Sesi dibatalkan otomatis.', '/bookings'));
            User::query()->find($session->mentor_id)?->notify(new SessionEvent('Laporan no-show berlaku. Sesi dibatalkan otomatis.', '/mentor/dashboard'));

            return true;
        });
    }
}

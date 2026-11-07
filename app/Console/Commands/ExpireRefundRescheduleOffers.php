<?php

namespace App\Console\Commands;

use App\Models\MentoringSession;
use App\Models\RescheduleRequest;
use App\Models\User;
use App\Notifications\SessionEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ExpireRefundRescheduleOffers extends Command
{
    private const REFUND_WINDOW_HOURS = 48;

    protected $signature = 'refund-reschedule:expire-offers';

    protected $description = 'Mengakhiri tawaran reschedule refund yang tidak direspons dalam 24 jam';

    public function handle(): int
    {
        $offerIds = RescheduleRequest::query()
            ->where('request_type', 'refund_reschedule_offer')
            ->where('status', 'menunggu_respons')
            ->where('respond_deadline', '<=', Carbon::now())
            ->pluck('id');

        $expiredCount = 0;

        foreach ($offerIds as $offerId) {
            if ($this->expireOffer((int) $offerId)) {
                $expiredCount++;
            }
        }

        $this->info("Tawaran reschedule refund kedaluwarsa: {$expiredCount}.");

        return self::SUCCESS;
    }

    private function expireOffer(int $offerId): bool
    {
        return DB::transaction(function () use ($offerId): bool {
            $offer = RescheduleRequest::query()
                ->whereKey($offerId)
                ->where('request_type', 'refund_reschedule_offer')
                ->where('status', 'menunggu_respons')
                ->lockForUpdate()
                ->first();

            if (! $offer) {
                return false;
            }

            $now = Carbon::now();

            if ($offer->respond_deadline->gt($now)) {
                return false;
            }

            $session = MentoringSession::query()
                ->whereKey($offer->session_id)
                ->lockForUpdate()
                ->first();

            $offer->update([
                'status' => 'kedaluwarsa',
                'responded_at' => $now,
            ]);

            if (! $session || $session->refund_status !== 'menunggu') {
                return false;
            }

            // Refund kembali berjalan dengan batas waktu 48 jam.
            $session->update([
                'refund_deadline' => $now->copy()->addHours(self::REFUND_WINDOW_HOURS),
            ]);

            User::query()->find($session->student_id)?->notify(
                new SessionEvent(
                    'Tawaran jadwal pengganti dari mentor telah kedaluwarsa. Proses refund dilanjutkan.',
                    '/bookings'
                )
            );

            User::query()->find($session->mentor_id)?->notify(
                new SessionEvent(
                    'Tawaran reschedule tidak direspons student. Proses refund dilanjutkan dengan batas waktu 48 jam.',
                    '/mentor/session/' . $session->id . '/refund'
                )
            );

            return true;
        });
    }
}
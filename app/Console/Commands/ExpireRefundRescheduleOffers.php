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

    protected $description = 'Mengakhiri tawaran reschedule yang tidak direspons dalam 24 jam';

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

        $this->info("Tawaran reschedule kedaluwarsa: {$expiredCount}.");

        return self::SUCCESS;
    }

    private function expireOffer(int $offerId): bool
    {
        return DB::transaction(function () use ($offerId): bool {
            // Ambil session_id terlebih dahulu tanpa mengunci offer.
            $sessionId = RescheduleRequest::query()
                ->whereKey($offerId)
                ->where('request_type', 'refund_reschedule_offer')
                ->value('session_id');

            if (! $sessionId) {
                return false;
            }

            // Kunci session terlebih dahulu agar urutannya konsisten
            // dengan controller.
            $session = MentoringSession::query()
                ->whereKey($sessionId)
                ->lockForUpdate()
                ->first();

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

            if (
                ! $offer->respond_deadline ||
                $offer->respond_deadline->gt($now)
            ) {
                return false;
            }

            // Tandai tawaran sebagai kedaluwarsa.
            $offer->update([
                'status' => 'kedaluwarsa',
                'responded_at' => $now,
            ]);

            if (! $session || $session->status !== 'dibatalkan') {
                return true;
            }

            $student = User::query()->find($session->student_id);
            $mentor = User::query()->find($session->mentor_id);

            // Sesi gratis: tetap dibatalkan dan tidak ada refund.
            if ($session->is_free_session) {
                if ($session->cancelled_by !== 'mentor') {
                    return true;
                }

                $student?->notify(
                    new SessionEvent(
                        'Tawaran jadwal pengganti untuk sesi gratis telah kedaluwarsa. Sesi tetap dibatalkan tanpa proses refund.',
                        '/bookings'
                    )
                );

                $mentor?->notify(
                    new SessionEvent(
                        'Tawaran jadwal pengganti untuk sesi gratis tidak direspons student dalam 24 jam. Sesi tetap dibatalkan.',
                        '/mentor/session/' . $session->id
                    )
                );

                return true;
            }

            // Sesi berbayar: refund dilanjutkan dengan batas waktu 48 jam.
            if ($session->refund_status !== 'menunggu') {
                return true;
            }

            $session->update([
                'refund_deadline' => $now->copy()->addHours(
                    self::REFUND_WINDOW_HOURS
                ),
            ]);

            $student?->notify(
                new SessionEvent(
                    'Tawaran jadwal pengganti dari mentor telah kedaluwarsa. Proses refund dilanjutkan dengan batas waktu 48 jam.',
                    '/bookings'
                )
            );

            $mentor?->notify(
                new SessionEvent(
                    'Tawaran reschedule tidak direspons student. Proses refund dilanjutkan dengan batas waktu 48 jam.',
                    '/mentor/session/' . $session->id . '/refund'
                )
            );

            return true;
        });
    }
}
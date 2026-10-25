<?php

namespace App\Services;

use App\Models\MentorProfile;
use App\Models\MentorSuspension;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MentorSuspensionService
{
    public function isSuspended(int $mentorId): bool
    {
        return MentorSuspension::query()
            ->where('mentor_id', $mentorId)
            ->active()
            ->exists();
    }

    /**
     * Suspend mentor. Mengembalikan null kalau mentor sudah sedang disuspend.
     */
    public function suspend(
        int $mentorId,
        string $reason,
        ?int $sessionId = null,
        ?string $note = null,
    ): ?MentorSuspension {
        return DB::transaction(function () use ($mentorId, $reason, $sessionId, $note): ?MentorSuspension {
            // Kunci baris profil supaya dua proses tidak membuat suspend ganda.
            MentorProfile::query()
                ->where('user_id', $mentorId)
                ->lockForUpdate()
                ->first();

            if ($this->isSuspended($mentorId)) {
                return null;
            }

            $suspension = MentorSuspension::query()->create([
                'mentor_id' => $mentorId,
                'reason' => $reason,
                'session_id' => $sessionId,
                'note' => $note,
                'suspended_at' => Carbon::now(),
            ]);

            MentorProfile::query()
                ->where('user_id', $mentorId)
                ->update(['is_suspended' => true]);

            return $suspension;
        });
    }

    /**
     * Cabut semua suspend aktif milik mentor. Mengembalikan jumlah yang dicabut.
     */
    public function lift(int $mentorId, ?int $liftedBy = null, ?string $note = null): int
    {
        return DB::transaction(function () use ($mentorId, $liftedBy, $note): int {
            $count = MentorSuspension::query()
                ->where('mentor_id', $mentorId)
                ->active()
                ->update([
                    'lifted_at' => Carbon::now(),
                    'lifted_by' => $liftedBy,
                    'lift_note' => $note,
                ]);

            if ($count > 0) {
                MentorProfile::query()
                    ->where('user_id', $mentorId)
                    ->update(['is_suspended' => false]);
            }

            return $count;
        });
    }
}

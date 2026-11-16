<?php

namespace App\Console\Commands;

use App\Models\MentoringSession;
use App\Models\Review;
use App\Services\MentorRatingService;
use Illuminate\Console\Command;

class AutoRateReviews extends Command
{
    protected $signature = 'reviews:auto-rate';

    protected $description = 'Beri rating 5 otomatis untuk sesi selesai yang belum diulas setelah 7 hari';

    public function handle(MentorRatingService $service): int
    {
        $cutoff = now()->subDays(7);

        $sessions = MentoringSession::query()
            ->where('status', 'selesai')
            ->whereNotNull('end_time')
            ->where('end_time', '<=', $cutoff)
            ->whereDoesntHave('review')
            ->get(['id', 'mentor_id', 'student_id']);

        $createdCount = 0;
        $mentorIds = [];

        foreach ($sessions as $session) {
            $review = Review::query()->firstOrCreate(
                ['session_id' => $session->id],
                [
                    'student_id' => $session->student_id,
                    'mentor_id' => $session->mentor_id,
                    'rating' => 5,
                    'feedback' => null,
                    'status' => Review::STATUS_DISETUJUI,
                ],
            );

            if ($review->wasRecentlyCreated) {
                $createdCount++;
                $mentorIds[(int) $session->mentor_id] = true;
            }
        }

        foreach (array_keys($mentorIds) as $mentorId) {
            $service->refreshAverage($mentorId);
        }

        $this->info("Auto rating selesai: {$createdCount} ulasan 5 bintang dibuat.");

        return self::SUCCESS;
    }
}

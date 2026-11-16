<?php

namespace App\Services;

use App\Models\MentorProfile;
use App\Models\Review;
use App\Models\User;
use Illuminate\Support\Collection;

class MentorRatingService
{
    public function refreshAverage(int $mentorUserId): void
    {
        $average = Review::query()
            ->approved()
            ->where('mentor_id', $mentorUserId)
            ->avg('rating');

        MentorProfile::query()
            ->where('user_id', $mentorUserId)
            ->update([
                'avg_rating' => round((float) ($average ?? 0), 2),
            ]);
    }

    /**
     * @return Collection<int, array{id: int, name: string, email: string|null, one_star_count: int}>
     */
    public function flaggedMentors(): Collection
    {
        $mentorIds = Review::query()
            ->approved()
            ->select('mentor_id')
            ->groupBy('mentor_id')
            ->havingRaw('COUNT(*) >= 3')
            ->pluck('mentor_id');

        return $mentorIds
            ->map(function (int|string $mentorId): ?array {
                $recentRatings = Review::query()
                    ->approved()
                    ->where('mentor_id', $mentorId)
                    ->orderByDesc('created_at')
                    ->orderByDesc('id')
                    ->limit(3)
                    ->pluck('rating');

                if (
                    $recentRatings->count() < 3
                    || $recentRatings->contains(fn ($rating): bool => (int) $rating !== 1)
                ) {
                    return null;
                }

                $mentor = User::query()->find($mentorId);

                return [
                    'id' => (int) $mentorId,
                    'name' => $mentor?->name ?? 'Mentor',
                    'email' => $mentor?->email,
                    'one_star_count' => Review::query()
                        ->approved()
                        ->where('mentor_id', $mentorId)
                        ->where('rating', 1)
                        ->count(),
                ];
            })
            ->filter()
            ->values();
    }
}

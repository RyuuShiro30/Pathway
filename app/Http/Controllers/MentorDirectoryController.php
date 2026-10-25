<?php

namespace App\Http\Controllers;

use App\Models\MentorProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MentorDirectoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $expertise = $request->input('expertise');
        $availability = $request->input('availability');
        $mentorType = $request->input('mentor_type');
        $minPrice = $request->input('min_price');
        $maxPrice = $request->input('max_price');
        $minRating = $request->input('min_rating');

        $mentors = MentorProfile::with('user')
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->where('verification_status', 'verified')
            ->when($search, function ($query) use ($search) {
                $query->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->whereRaw(
                        'LOWER(name) LIKE ?',
                        ['%' . strtolower($search) . '%']
                    );
                });
            })
            ->when($expertise, function ($query) use ($expertise) {
                $query->where('expertise', $expertise);
            })
            ->when(
                $availability !== null && $availability !== '',
                function ($query) use ($availability) {
                    $query->where('is_available', $availability);
                }
            )
            ->when($mentorType, function ($query) use ($mentorType) {
                $query->where('mentor_type', $mentorType);
            })
            ->when($minPrice !== null && $minPrice !== '', function ($query) use ($minPrice) {
                $query->where('price_per_session', '>=', $minPrice);
            })
            ->when($maxPrice !== null && $maxPrice !== '', function ($query) use ($maxPrice) {
                $query->where('price_per_session', '<=', $maxPrice);
            })
            ->when($minRating !== null && $minRating !== '', function ($query) use ($minRating) {
                if ((float) $minRating === 5.0) {
                    $query->whereRaw(
                        'COALESCE((SELECT AVG(rating) FROM reviews WHERE reviews.mentor_id = mentor_profiles.user_id), mentor_profiles.avg_rating) >= ?',
                        [5]
                    );
                } else {
                    $query->whereRaw(
                        'COALESCE((SELECT AVG(rating) FROM reviews WHERE reviews.mentor_id = mentor_profiles.user_id), mentor_profiles.avg_rating) >= ?',
                        [$minRating]
                    );
                }
            })
            ->get()
            ->map(function ($mentor) {
                $mentor->avg_rating = $mentor->reviews_avg_rating !== null
                    ? round((float) $mentor->reviews_avg_rating, 1)
                    : (float) ($mentor->avg_rating ?? 0);

                return $mentor;
            });

        $expertises = MentorProfile::where('verification_status', 'verified')
            ->select('expertise')
            ->distinct()
            ->orderBy('expertise')
            ->pluck('expertise');

        return Inertia::render('Mentors/Index', [
            'mentors' => $mentors,
            'search' => $search,
            'expertise' => $expertise,
            'expertises' => $expertises,
            'availability' => $availability,
            'mentorType' => $mentorType,
            'minPrice' => $minPrice,
            'maxPrice' => $maxPrice,
            'minRating' => $minRating,
        ]);
    }

    public function show($id)
    {
        $mentor = MentorProfile::with([
                'user',
                'certificates',
                'reviews.student',
            ])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->where('verification_status', 'verified')
            ->findOrFail($id);

        $mentor->avg_rating = $mentor->reviews_avg_rating !== null
            ? round((float) $mentor->reviews_avg_rating, 1)
            : (float) ($mentor->avg_rating ?? 0);

        return Inertia::render('Mentors/Show', [
            'mentor' => $mentor,
        ]);
    }
}

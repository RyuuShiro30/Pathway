<?php

namespace App\Http\Controllers;

use App\Models\MentoringSession;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function create(MentoringSession $session)
    {
        if ($session->status !== 'selesai') {
            abort(404);
        }

        if ((int) $session->student_id !== (int) Auth::id()) {
            abort(403);
        }

        if (Review::where('session_id', $session->id)->exists()) {
            return redirect()
                ->route('mentors.show', $session->mentor->mentorProfile->id)
                ->with('error', 'Sesi ini sudah memiliki ulasan.');
        }

        $session->load('mentor');

        return Inertia::render('Reviews/Create', [
            'session' => [
                'id' => $session->id,
                'status' => $session->status,
                'schedule_time' => $session->schedule_time?->format('d M Y'),
                'mentor' => [
                    'id' => $session->mentor?->id,
                    'name' => $session->mentor?->name ?? 'Mentor',
                ],
            ],
        ]);
    }

    public function store(Request $request, MentoringSession $session)
    {
        if ($session->status !== 'selesai') {
            abort(404);
        }

        if ((int) $session->student_id !== (int) Auth::id()) {
            abort(403);
        }

        if (Review::where('session_id', $session->id)->exists()) {
            return back()->with('error', 'Sesi ini sudah memiliki ulasan.');
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        Review::create([
            'session_id' => $session->id,
            'student_id' => $session->student_id,
            'mentor_id' => $session->mentor_id,
            'rating' => $validated['rating'],
            'feedback' => $validated['feedback'] ?? null,
        ]);

        $mentorProfile = \App\Models\MentorProfile::where(
            'user_id',
            $session->mentor_id
        )->firstOrFail();

        $averageRating = Review::where('mentor_id', $session->mentor_id)
            ->avg('rating');

        $mentorProfile->update([
            'avg_rating' => round((float) $averageRating, 2),
        ]);

        return redirect()
            ->route('mentors.show', $mentorProfile->id)
            ->with('success', 'Rating dan ulasan berhasil dikirim.');
    }
}

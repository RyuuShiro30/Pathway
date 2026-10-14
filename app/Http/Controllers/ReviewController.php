<?php
namespace App\Http\Controllers;

use App\Models\MentoringSession;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function create(MentoringSession $session)
    {
        if ($session->status !== 'completed') {
            abort(404);
        }

        if ((int) $session->student_id !== (int) auth()->id()) {
            abort(403);
        }

        if (Review::where('session_id', $session->id)->exists()) {
            return redirect('/dashboard')
                ->with('error', 'Sesi ini sudah memiliki ulasan.');
        }

        return view('reviews.create', compact('session'));
    }

    public function store(Request $request, MentoringSession $session)
    {
        if ($session->status !== 'completed') {
            abort(404);
        }

        if ((int) $session->student_id !== (int) auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        if (Review::where('session_id', $session->id)->exists()) {
            return redirect('/dashboard')
                ->with('error', 'Sesi ini sudah memiliki ulasan.');
        }

        Review::create([
            'session_id' => $session->id,
            'student_id' => $session->student_id,
            'mentor_id' => $session->mentor_id,
            'rating' => $validated['rating'],
            'feedback' => $validated['feedback'] ?? null,
        ]);

        return redirect('/dashboard')
            ->with('success', 'Ulasan berhasil dikirim.');
    }
}
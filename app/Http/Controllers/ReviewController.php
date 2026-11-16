<?php

namespace App\Http\Controllers;

use App\Models\MentoringSession;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
                ->route('dashboard')
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

        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ], [
            'rating.required' => 'Rating wajib dipilih.',
            'rating.integer' => 'Rating harus berupa angka.',
            'rating.min' => 'Rating minimal 1 bintang.',
            'rating.max' => 'Rating maksimal 5 bintang.',
            'feedback.max' => 'Ulasan maksimal 1000 karakter.',
        ]);

        $created = DB::transaction(function () use ($session, $validated): bool {
            MentoringSession::query()
                ->whereKey($session->id)
                ->lockForUpdate()
                ->first();

            if (Review::where('session_id', $session->id)->exists()) {
                return false;
            }

            Review::create([
                'session_id' => $session->id,
                'student_id' => $session->student_id,
                'mentor_id' => $session->mentor_id,
                'rating' => $validated['rating'],
                'feedback' => $validated['feedback'] ?? null,
                'status' => Review::STATUS_MENUNGGU,
            ]);

            return true;
        });

        if (! $created) {
            return back()->with('error', 'Sesi ini sudah memiliki ulasan.');
        }

        return redirect()
            ->route('dashboard')
            ->with('success', 'Ulasan berhasil dikirim dan menunggu moderasi admin.');
    }
}

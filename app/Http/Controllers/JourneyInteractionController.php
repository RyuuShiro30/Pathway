<?php

namespace App\Http\Controllers;

use App\Models\Journey;
use App\Models\JourneyBookmark;
use App\Models\JourneyComment;
use App\Models\JourneyLike;
use App\Models\JourneyReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class JourneyInteractionController extends Controller
{
    public function saved()
    {
        $journeys = Journey::query()
            ->with('author:id,name')
            ->whereIn(
                'id',
                JourneyBookmark::query()
                    ->where('user_id', Auth::id())
                    ->select('journey_id')
            )
            ->published()
            ->latest()
            ->paginate(10);

        return Inertia::render('Journeys/Saved', [
            'journeys' => $journeys,
        ]);
    }

    public function toggleLike(Journey $journey)
    {
        $this->ensurePublished($journey);

        $userId = (int) Auth::id();

        DB::transaction(function () use ($journey, $userId) {
            $lockedJourney = Journey::query()
                ->whereKey($journey->id)
                ->lockForUpdate()
                ->firstOrFail();

            $like = JourneyLike::query()
                ->where('journey_id', $journey->id)
                ->where('user_id', $userId)
                ->first();

            if ($like) {
                $like->delete();
                $lockedJourney->update([
                    'likes_count' => max(0, $lockedJourney->likes_count - 1),
                ]);

                return;
            }

            JourneyLike::query()->create([
                'journey_id' => $journey->id,
                'user_id' => $userId,
            ]);

            $lockedJourney->increment('likes_count');
        });

        return back();
    }

    public function toggleBookmark(Journey $journey)
    {
        $this->ensurePublished($journey);

        $userId = (int) Auth::id();

        $bookmark = JourneyBookmark::query()
            ->where('journey_id', $journey->id)
            ->where('user_id', $userId)
            ->first();

        if ($bookmark) {
            $bookmark->delete();

            return back()->with(
                'success',
                'Cerita dihapus dari daftar tersimpan.'
            );
        }

        JourneyBookmark::query()->create([
            'journey_id' => $journey->id,
            'user_id' => $userId,
        ]);

        return back()->with('success', 'Cerita disimpan ke daftar tersimpan.');
    }

    public function storeComment(Request $request, Journey $journey)
    {
        $this->ensurePublished($journey);

        abort_unless(
            $journey->allow_comments,
            403,
            'Kolom komentar dinonaktifkan oleh penulis.'
        );

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:1000'],
        ], [
            'body.required' => 'Komentar wajib diisi.',
            'body.max' => 'Komentar maksimal 1000 karakter.',
        ]);

        JourneyComment::query()->create([
            'journey_id' => $journey->id,
            'user_id' => Auth::id(),
            'body' => $validated['body'],
        ]);

        return back()->with('success', 'Komentar berhasil ditambahkan.');
    }

    public function destroyComment(Journey $journey, int $comment)
    {
        $this->ensurePublished($journey);

        $journeyComment = JourneyComment::query()
            ->where('journey_id', $journey->id)
            ->findOrFail($comment);

        $userId = (int) Auth::id();

        abort_unless(
            $journeyComment->user_id === $userId
                || $journey->author_id === $userId
                || Auth::user()?->role === 'admin',
            403
        );

        $journeyComment->delete();

        return back()->with('success', 'Komentar berhasil dihapus.');
    }

    public function toggleComments(Journey $journey)
    {
        $this->ensurePublished($journey);

        $userId = (int) Auth::id();

        abort_unless(
            $journey->author_id === $userId
                || Auth::user()?->role === 'admin',
            403
        );

        $journey->update(['allow_comments' => ! $journey->allow_comments]);

        return back()->with(
            'success',
            $journey->allow_comments
                ? 'Kolom komentar diaktifkan.'
                : 'Kolom komentar dinonaktifkan.'
        );
    }

    public function storeReport(Request $request, Journey $journey)
    {
        $this->ensurePublished($journey);

        $userId = (int) Auth::id();

        if ($journey->author_id === $userId) {
            return back()->with(
                'error',
                'Kamu tidak dapat melaporkan ceritamu sendiri.'
            );
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ], [
            'reason.required' => 'Alasan laporan wajib diisi.',
            'reason.max' => 'Alasan laporan maksimal 500 karakter.',
        ]);

        $alreadyReported = JourneyReport::query()
            ->where('journey_id', $journey->id)
            ->where('reporter_id', $userId)
            ->exists();

        if ($alreadyReported) {
            return back()->with(
                'error',
                'Kamu sudah melaporkan cerita ini.'
            );
        }

        JourneyReport::query()->create([
            'journey_id' => $journey->id,
            'reporter_id' => $userId,
            'reason' => $validated['reason'],
            'status' => JourneyReport::STATUS_MENUNGGU,
        ]);

        return back()->with(
            'success',
            'Laporan berhasil dikirim. Admin akan meninjau cerita ini.'
        );
    }

    private function ensurePublished(Journey $journey): void
    {
        abort_unless($journey->status === Journey::STATUS_PUBLISHED, 404);
    }
}

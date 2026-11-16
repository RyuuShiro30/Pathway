<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Services\MentorRatingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminReviewController extends Controller
{
    private const STATUS_FILTERS = [
        Review::STATUS_MENUNGGU,
        Review::STATUS_DISETUJUI,
        Review::STATUS_DITOLAK,
        'semua',
    ];

    public function index(Request $request, MentorRatingService $ratingService)
    {
        $status = (string) $request->query('status', Review::STATUS_MENUNGGU);

        if (! in_array($status, self::STATUS_FILTERS, true)) {
            $status = Review::STATUS_MENUNGGU;
        }

        $reviews = Review::query()
            ->with([
                'student:id,name,email',
                'mentor:id,name,email',
                'session:id,schedule_time',
            ])
            ->when(
                $status !== 'semua',
                fn ($query) => $query->where('status', $status)
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Review/Index', [
            'reviews' => $reviews,
            'currentStatus' => $status,
            'counts' => [
                'menunggu' => Review::where('status', Review::STATUS_MENUNGGU)->count(),
                'disetujui' => Review::where('status', Review::STATUS_DISETUJUI)->count(),
                'ditolak' => Review::where('status', Review::STATUS_DITOLAK)->count(),
                'semua' => Review::count(),
            ],
            'flaggedMentors' => $ratingService->flaggedMentors(),
        ]);
    }

    public function approve(Review $review, MentorRatingService $ratingService): RedirectResponse
    {
        DB::transaction(function () use ($review, $ratingService): void {
            $locked = Review::query()
                ->whereKey($review->id)
                ->lockForUpdate()
                ->firstOrFail();

            $locked->update([
                'status' => Review::STATUS_DISETUJUI,
                'moderation_note' => null,
            ]);

            $ratingService->refreshAverage((int) $locked->mentor_id);
        });

        return redirect()
            ->back()
            ->with('success', 'Ulasan berhasil disetujui dan ditampilkan di profil mentor.');
    }

    public function reject(
        Request $request,
        Review $review,
        MentorRatingService $ratingService,
    ): RedirectResponse {
        $validated = $request->validate([
            'moderation_note' => ['nullable', 'string', 'max:500'],
        ], [
            'moderation_note.max' => 'Catatan moderasi maksimal 500 karakter.',
        ]);

        DB::transaction(function () use ($review, $validated, $ratingService): void {
            $locked = Review::query()
                ->whereKey($review->id)
                ->lockForUpdate()
                ->firstOrFail();

            $locked->update([
                'status' => Review::STATUS_DITOLAK,
                'moderation_note' => $validated['moderation_note'] ?? null,
            ]);

            $ratingService->refreshAverage((int) $locked->mentor_id);
        });

        return redirect()
            ->back()
            ->with('success', 'Ulasan ditolak dan tidak ditampilkan di profil mentor.');
    }
}

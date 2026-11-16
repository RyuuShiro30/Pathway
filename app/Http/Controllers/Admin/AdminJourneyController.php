<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Journey;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminJourneyController extends Controller
{
    private const STATUSES = ['menunggu', 'published', 'ditolak', 'semua'];

    public function index(Request $request)
    {
        $currentStatus = $request->query('status', Journey::STATUS_MENUNGGU);

        if (! in_array($currentStatus, self::STATUSES, true)) {
            $currentStatus = Journey::STATUS_MENUNGGU;
        }

        $journeys = Journey::query()
            ->with('author:id,name,email')
            ->when(
                $currentStatus !== 'semua',
                fn ($query) => $query->where('status', $currentStatus)
            )
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $counts = [
            'menunggu' => Journey::where('status', Journey::STATUS_MENUNGGU)->count(),
            'published' => Journey::where('status', Journey::STATUS_PUBLISHED)->count(),
            'ditolak' => Journey::where('status', Journey::STATUS_DITOLAK)->count(),
            'semua' => Journey::count(),
        ];

        return Inertia::render('Admin/Journey/Index', [
            'journeys' => $journeys,
            'counts' => $counts,
            'currentStatus' => $currentStatus,
        ]);
    }

    public function approve(Journey $journey)
    {
        $journey->update([
            'status' => Journey::STATUS_PUBLISHED,
            'moderation_note' => null,
        ]);

        return back()->with(
            'success',
            'Journey berhasil disetujui dan tayang di halaman publik.'
        );
    }

    public function reject(Request $request, Journey $journey)
    {
        $validated = $request->validate([
            'moderation_note' => ['nullable', 'string', 'max:500'],
        ], [
            'moderation_note.max' => 'Catatan moderasi maksimal 500 karakter.',
        ]);

        $journey->update([
            'status' => Journey::STATUS_DITOLAK,
            'moderation_note' => $validated['moderation_note'] ?? null,
        ]);

        return back()->with(
            'success',
            'Journey ditolak. Pembuat dapat melihat status dan catatan moderasi.'
        );
    }
}

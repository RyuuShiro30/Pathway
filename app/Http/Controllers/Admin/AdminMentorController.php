<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MentorProfile;
use App\Services\MentorSuspensionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminMentorController extends Controller
{
    public function __construct(
        private readonly MentorSuspensionService $suspensionService
    ) {}

    public function index(Request $request)
    {
        $status = $request->query('status', 'semua');
        $search = $request->query('search', '');

        $query = MentorProfile::with(['user', 'certificates']);

        if ($status === 'suspended') {
            $query->where('is_suspended', true);
        } elseif ($status !== 'semua') {
            $query->where('verification_status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('expertise', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $mentors = $query->latest()->get()->map(fn (MentorProfile $profile) => [
            'id' => $profile->id,
            'user_id' => $profile->user_id,
            'name' => $profile->user?->name ?? '-',
            'email' => $profile->user?->email ?? '-',
            'expertise' => $profile->expertise,
            'mentor_type' => $profile->mentor_type,
            'price_per_session' => $profile->price_per_session,
            'avg_rating' => $profile->avg_rating,
            'verification_status' => $profile->verification_status,
            'is_suspended' => (bool) $profile->is_suspended,
            'portfolio_url' => $profile->portfolio_url,
            'certificates_count' => $profile->certificates->count(),
        ]);

        return Inertia::render('Admin/Mentor/Index', [
            'mentors' => $mentors,
            'filters' => [
                'status' => $status,
                'search' => $search,
            ],
        ]);
    }

    public function verify(Request $request, MentorProfile $mentorProfile)
    {
        $validated = $request->validate([
            'verification_status' => ['required', 'in:approved,rejected'],
        ]);

        $mentorProfile->update([
            'verification_status' => $validated['verification_status'],
        ]);

        return back()->with('success', 'Status verifikasi mentor berhasil diperbarui.');
    }

    public function suspend(Request $request, MentorProfile $mentorProfile)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
            'session_id' => ['nullable', 'integer'],
        ]);

        $suspension = $this->suspensionService->suspend(
            mentorId: $mentorProfile->user_id,
            reason: $validated['reason'],
            sessionId: $validated['session_id'] ?? null,
            note: $validated['note'] ?? null,
        );

        if (! $suspension) {
            return back()->with('error', 'Mentor ini sudah dalam status suspend.');
        }

        return back()->with('success', 'Akun mentor berhasil disuspend.');
    }

    public function unsuspend(Request $request, MentorProfile $mentorProfile)
    {
        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->suspensionService->lift(
            mentorId: $mentorProfile->user_id,
            liftedBy: $request->user()?->id,
            note: $validated['note'] ?? 'Suspend dicabut oleh Admin.',
        );

        return back()->with('success', 'Status suspend mentor berhasil dicabut.');
    }
}
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NoShowReport;
use App\Models\User;
use App\Notifications\SessionEvent;
use App\Services\NoShowSanctionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminNoShowReportController extends Controller
{
    public function __construct(
        private readonly NoShowSanctionService $sanctionService,
    ) {}

    public function index(Request $request): Response
    {
        $statusFilter = $request->query('status', 'disanggah');

        $query = NoShowReport::with([
            'session.student',
            'session.mentor.mentorProfile',
            'reporter',
            'reportedUser',
            'decidedBy',
        ]);

        if ($statusFilter !== 'semua') {
            $query->where('status', $statusFilter);
        }

        $reports = $query
            ->orderByRaw("CASE 
                WHEN status = 'disanggah' THEN 0 
                WHEN status = 'menunggu_respons' THEN 1 
                WHEN status = 'berlaku' THEN 2 
                WHEN status = 'ditolak' THEN 3
                ELSE 4 
            END")
            ->latest('updated_at')
            ->get()
            ->map(fn (NoShowReport $report) => $this->formatReport($report));

        return Inertia::render('Admin/NoShowReport/Index', [
            'reports' => $reports,
            'currentStatus' => $statusFilter,
            'counts' => [
                'disanggah' => NoShowReport::where('status', 'disanggah')->count(),
                'menunggu_respons' => NoShowReport::where('status', 'menunggu_respons')->count(),
                'berlaku' => NoShowReport::where('status', 'berlaku')->count(),
                'ditolak' => NoShowReport::where('status', 'ditolak')->count(),
                'tidak_berlaku' => NoShowReport::where('status', 'tidak_berlaku')->count(),
            ],
        ]);
    }

    public function show(NoShowReport $report): Response
    {
        $report->load([
            'session.student',
            'session.mentor.mentorProfile',
            'reporter',
            'reportedUser',
            'decidedBy',
        ]);

        return Inertia::render('Admin/NoShowReport/Show', [
            'report' => $this->formatReport($report),
        ]);
    }

    public function decide(Request $request, NoShowReport $report): RedirectResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'in:valid,ditolak'],
            'admin_note' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'decision.required' => 'Keputusan wajib dipilih.',
            'decision.in' => 'Keputusan harus berupa valid atau ditolak.',
            'admin_note.required' => 'Catatan keputusan wajib diisi.',
            'admin_note.min' => 'Catatan keputusan minimal 5 karakter.',
        ]);

        return DB::transaction(function () use ($report, $validated): RedirectResponse {
            $lockedReport = NoShowReport::query()
                ->whereKey($report->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedReport->status !== 'disanggah') {
                throw ValidationException::withMessages([
                    'report' => 'Hanya laporan berstatus disanggah yang dapat diputuskan.',
                ]);
            }

            $now = Carbon::now();
            $adminId = (int) Auth::id();

            if ($validated['decision'] === 'valid') {
                $lockedReport->update([
                    'admin_note' => $validated['admin_note'],
                    'decided_by' => $adminId,
                    'decided_at' => $now,
                ]);

                $applied = $this->sanctionService->apply($lockedReport);

                $message = $applied
                    ? 'Laporan no-show disetujui (valid) dan sanksi berhasil diterapkan.'
                    : 'Laporan no-show ditutup tanpa sanksi karena status sesi sudah berubah.';
            } else {
                $lockedReport->update([
                    'status' => 'ditolak',
                    'admin_note' => $validated['admin_note'],
                    'decided_by' => $adminId,
                    'decided_at' => $now,
                    'finalized_at' => $now,
                ]);

                $session = $lockedReport->session;
                if ($session) {
                    $notifMessage = 'Laporan no-show ditolak oleh admin.';
                    User::query()->find($session->student_id)?->notify(new SessionEvent($notifMessage, '/bookings'));
                    User::query()->find($session->mentor_id)?->notify(new SessionEvent($notifMessage, '/mentor/dashboard'));
                }

                $message = 'Laporan no-show berhasil ditolak.';
            }

            return redirect()
                ->route('admin.no-show-reports.show', $lockedReport->id)
                ->with('success', $message);
        });
    }

    private function formatReport(NoShowReport $report): array
    {
        $session = $report->session;

        return [
            'id' => $report->id,
            'session_id' => $report->session_id,
            'status' => $report->status,
            'reporter_id' => $report->reporter_id,
            'reported_user_id' => $report->reported_user_id,
            'reporter_role' => $session ? ((int) $report->reporter_id === (int) $session->student_id ? 'student' : 'mentor') : null,
            'reported_role' => $session ? ((int) $report->reported_user_id === (int) $session->student_id ? 'student' : 'mentor') : null,
            'reporter_note' => $report->reporter_note,
            'evidence_url' => route('no-show.evidence', ['id' => $report->id, 'type' => 'report']),
            'respond_deadline' => $report->respond_deadline?->format('d M Y, H:i'),
            'response_note' => $report->response_note,
            'response_evidence_url' => $report->response_evidence_path
                ? route('no-show.evidence', ['id' => $report->id, 'type' => 'response'])
                : null,
            'responded_at' => $report->responded_at?->format('d M Y, H:i'),
            'finalized_at' => $report->finalized_at?->format('d M Y, H:i'),
            'admin_note' => $report->admin_note,
            'decided_at' => $report->decided_at?->format('d M Y, H:i'),
            'decided_by' => $report->decidedBy ? [
                'id' => $report->decidedBy->id,
                'name' => $report->decidedBy->name,
                'email' => $report->decidedBy->email,
            ] : null,
            'session' => $session ? [
                'id' => $session->id,
                'status' => $session->status,
                'schedule_time' => $session->schedule_time?->format('d M Y, H:i'),
                'is_free_session' => (bool) $session->is_free_session,
                'price_snapshot' => $session->price_snapshot,
                'dp_amount' => $session->price_snapshot ? (int) ceil(((float) $session->price_snapshot) * 0.5) : 0,
                'payment_dp_status' => $session->payment_dp_status,
                'refund_status' => $session->refund_status,
                'refund_deadline' => $session->refund_deadline?->format('d M Y, H:i'),
                'student' => $session->student ? [
                    'id' => $session->student->id,
                    'name' => $session->student->name,
                    'email' => $session->student->email,
                ] : null,
                'mentor' => $session->mentor ? [
                    'id' => $session->mentor->id,
                    'name' => $session->mentor->name,
                    'email' => $session->mentor->email,
                ] : null,
            ] : null,
            'reporter' => $report->reporter ? [
                'id' => $report->reporter->id,
                'name' => $report->reporter->name,
                'email' => $report->reporter->email,
            ] : null,
            'reported_user' => $report->reportedUser ? [
                'id' => $report->reportedUser->id,
                'name' => $report->reportedUser->name,
                'email' => $report->reportedUser->email,
            ] : null,
        ];
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MentoringSession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminRefundReportController extends Controller
{
    public function index(Request $request)
    {
        $statusFilter = $request->query('status', 'dilaporkan');

        $query = MentoringSession::with(['student', 'mentor'])
            ->whereIn('refund_status', ['dilaporkan', 'menunggu', 'selesai']);

        if ($statusFilter !== 'semua') {
            $query->where('refund_status', $statusFilter);
        }

        $reports = $query
            ->orderByRaw("CASE WHEN refund_status = 'dilaporkan' THEN 0 WHEN refund_status = 'menunggu' THEN 1 ELSE 2 END")
            ->latest('updated_at')
            ->get()
            ->map(fn (MentoringSession $session) => $this->formatSession($session));

        return Inertia::render('Admin/RefundReport/Index', [
            'reports' => $reports,
            'currentStatus' => $statusFilter,
            'counts' => [
                'dilaporkan' => MentoringSession::where('refund_status', 'dilaporkan')->count(),
                'menunggu' => MentoringSession::where('refund_status', 'menunggu')->count(),
                'selesai' => MentoringSession::where('refund_status', 'selesai')->count(),
            ],
        ]);
    }

    public function show(MentoringSession $session)
    {
        $session->load(['student', 'mentor.mentorProfile']);

        return Inertia::render('Admin/RefundReport/Show', [
            'report' => $this->formatSession($session),
        ]);
    }

    public function decide(Request $request, MentoringSession $session)
    {
        $validated = $request->validate([
            'decision' => ['required', 'in:valid,bermasalah'],
            'admin_note' => ['required', 'string', 'min:5', 'max:1000'],
        ], [
            'admin_note.required' => 'Catatan keputusan wajib diisi sebelum menyimpan.',
        ]);

        if ($validated['decision'] === 'valid') {
            $session->update([
                'refund_status' => 'selesai',
                'refund_deadline' => null,
                'refund_admin_note' => $validated['admin_note'],
                'refund_reviewed_at' => now(),
            ]);

            $message = 'Bukti refund dinyatakan VALID dan status transaksi selesai.';
        } else {
            $session->update([
                'refund_status' => 'menunggu',
                'refund_deadline' => now()->addHours(48),
                'refund_admin_note' => $validated['admin_note'],
                'refund_reviewed_at' => now(),
            ]);

            $message = 'Bukti ditandai bermasalah. Status dikembalikan ke MENUNGGU dengan batas waktu baru 48 jam.';
        }

        return redirect()
            ->route('admin.refund-reports.show', $session->id)
            ->with('success', $message);
    }

    private function formatSession(MentoringSession $session): array
    {
        $studentData = $session->student ? $session->student->toArray() : [];

        return [
            'id' => $session->id,
            'status' => $session->status,
            'refund_status' => $session->refund_status,
            'schedule_time' => $session->schedule_time?->format('d M Y, H:i'),
            'price_snapshot' => $session->price_snapshot,
            'dp_amount' => $session->price_snapshot ? (float) $session->price_snapshot * 0.5 : 0,
            'cancelled_by' => $session->cancelled_by,
            'cancellation_reason' => $session->cancellation_reason,
            'payment_dp_proof' => $this->resolveFileUrl($session->payment_dp_proof),
            'refund_proof' => $this->resolveFileUrl($session->refund_proof),
            'refund_proof_uploaded_at' => $session->refund_proof_uploaded_at?->format('d M Y, H:i'),
            'refund_deadline' => $session->refund_deadline?->format('d M Y, H:i'),
            'refund_admin_note' => $session->refund_admin_note,
            'refund_reviewed_at' => $session->refund_reviewed_at?->format('d M Y, H:i'),
            'student' => [
                'id' => $session->student?->id,
                'name' => $session->student?->name ?? '-',
                'email' => $session->student?->email ?? '-',
                'bank_name' => $studentData['bank_name'] ?? $studentData['nama_bank'] ?? '-',
                'bank_account_number' => $studentData['bank_account_number'] ?? $studentData['account_number'] ?? $studentData['no_rekening'] ?? '-',
                'bank_account_name' => $studentData['bank_account_name'] ?? $studentData['account_holder'] ?? $studentData['atas_nama'] ?? ($session->student?->name ?? '-'),
            ],
            'mentor' => [
                'id' => $session->mentor?->id,
                'profile_id' => $session->mentor?->mentorProfile?->id,
                'name' => $session->mentor?->name ?? '-',
                'email' => $session->mentor?->email ?? '-',
                'is_suspended' => (bool) ($session->mentor?->mentorProfile?->is_suspended ?? false),
            ],
        ];
    }

    private function resolveFileUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://') || str_starts_with($path, '/storage/')) {
            return $path;
        }

        return '/storage/' . ltrim($path, '/');
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\MentoringSession;
use App\Models\NoShowReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class NoShowReportController extends Controller
{
    private const EARLIEST_REPORT_MINUTES_AFTER_START = 15;

    private const LATEST_REPORT_HOURS_AFTER_END = 24;

    private const RESPONSE_WINDOW_HOURS = 24;

    public function store(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'evidence' => ['required', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
            'reporter_note' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($request, $id, $validated): void {
            $userId = (int) Auth::id();

            $session = MentoringSession::query()
                ->whereKey($id)
                ->where(function ($query) use ($userId): void {
                    $query->where('student_id', $userId)
                        ->orWhere('mentor_id', $userId);
                })
                ->lockForUpdate()
                ->firstOrFail();

            if ($session->status !== 'dikonfirmasi') {
                $this->fail('Hanya sesi yang berstatus dikonfirmasi yang bisa dilaporkan.');
            }

            $now = Carbon::now();
            $endTime = $session->end_time
                ?? $session->schedule_time->copy()->addHours($session->duration_hours ?? 1);

            if ($now->lt($session->schedule_time->copy()->addMinutes(self::EARLIEST_REPORT_MINUTES_AFTER_START))) {
                $this->fail('Laporan baru bisa dibuat 15 menit setelah jadwal sesi dimulai.');
            }

            if ($now->gt($endTime->copy()->addHours(self::LATEST_REPORT_HOURS_AFTER_END))) {
                $this->fail('Batas waktu melapor (24 jam setelah sesi berakhir) sudah lewat.');
            }

            if (NoShowReport::query()->where('session_id', $session->id)->exists()) {
                $this->fail('Sesi ini sudah memiliki laporan no-show.');
            }

            $evidencePath = $request->file('evidence')->store('no-show-reports', 'local');

            NoShowReport::query()->create([
                'session_id' => $session->id,
                'reporter_id' => $userId,
                'reported_user_id' => $session->student_id === $userId
                    ? $session->mentor_id
                    : $session->student_id,
                'status' => 'menunggu_respons',
                'reporter_note' => $validated['reporter_note'] ?? null,
                'evidence_path' => $evidencePath,
                'respond_deadline' => $now->copy()->addHours(self::RESPONSE_WINDOW_HOURS),
            ]);
        });

        return redirect()->back()->with(
            'success',
            'Laporan no-show terkirim. Pihak lawan punya 24 jam untuk menanggapi.',
        );
    }

    public function respond(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'response_note' => ['required', 'string', 'max:500'],
            'response_evidence' => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
        ]);

        DB::transaction(function () use ($request, $id, $validated): void {
            $report = NoShowReport::query()
                ->whereKey($id)
                ->where('reported_user_id', Auth::id())
                ->lockForUpdate()
                ->firstOrFail();

            if ($report->status !== 'menunggu_respons') {
                $this->fail('Laporan ini sudah tidak menunggu tanggapan.');
            }

            $now = Carbon::now();

            if ($now->gte($report->respond_deadline)) {
                $this->fail('Batas waktu menanggapi (24 jam) sudah lewat.');
            }

            $evidencePath = $request->hasFile('response_evidence')
                ? $request->file('response_evidence')->store('no-show-responses', 'local')
                : null;

            $report->update([
                'status' => 'disanggah',
                'response_note' => $validated['response_note'],
                'response_evidence_path' => $evidencePath,
                'responded_at' => $now,
            ]);
        });

        return redirect()->back()->with(
            'success',
            'Sanggahan terkirim. Laporan ini akan ditinjau admin.',
        );
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['message' => $message]);
    }
}

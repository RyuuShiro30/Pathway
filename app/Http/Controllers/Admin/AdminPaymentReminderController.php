<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MentoringSession;
use App\Notifications\SessionEvent;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminPaymentReminderController extends Controller
{
    public function index(Request $request): Response
    {
        $sessions = MentoringSession::with(['student', 'mentor'])
            ->where('is_free_session', false)
            ->whereIn('status', ['berlangsung', 'selesai'])
            ->whereIn('payment_final_status', ['belum_dibayar', 'ditolak'])
            ->orderBy('schedule_time', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $reminders = $sessions->map(fn (MentoringSession $session) => $this->formatSession($session));
        $canRemindCount = $reminders->where('can_remind', true)->count();

        return Inertia::render('Admin/PaymentReminder/Index', [
            'reminders' => $reminders->values()->all(),
            'sessions' => $reminders->values()->all(),
            'total' => $sessions->count(),
            'canRemindCount' => $canRemindCount,
            'counts' => [
                'total' => $sessions->count(),
                'can_remind' => $canRemindCount,
                'belum_dibayar' => $sessions->where('payment_final_status', 'belum_dibayar')->count(),
                'ditolak' => $sessions->where('payment_final_status', 'ditolak')->count(),
            ],
        ]);
    }

    public function remind(Request $request, MentoringSession $session)
    {
        if (
            $session->is_free_session
            || ! in_array($session->status, ['berlangsung', 'selesai'], true)
            || ! in_array($session->payment_final_status, ['belum_dibayar', 'ditolak'], true)
        ) {
            $errorMessage = 'Sesi mentoring ini tidak memenuhi kriteria pengingat pelunasan.';

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => $errorMessage,
                    'errors' => ['session' => [$errorMessage]],
                ], 422);
            }

            return back()
                ->with('error', $errorMessage)
                ->withErrors(['session' => $errorMessage]);
        }

        $canRemind = $session->payment_final_reminded_at === null
            || $session->payment_final_reminded_at->lte(now()->subHours(24));

        if (! $canRemind) {
            $errorMessage = 'Pengingat pelunasan hanya dapat dikirim sekali dalam 24 jam.';

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => $errorMessage,
                    'errors' => ['session' => [$errorMessage]],
                ], 422);
            }

            return back()
                ->with('error', $errorMessage)
                ->withErrors(['session' => $errorMessage]);
        }

        $session->loadMissing(['student', 'mentor']);

        $mentorName = $session->mentor?->name ?? 'Mentor';
        $message = "Pengingat: sisa pelunasan 50% untuk sesi mentoring bersama {$mentorName} belum dibayar. Silakan upload bukti pelunasan.";

        $session->student?->notify(new SessionEvent($message, '/bookings'));

        $session->update([
            'payment_final_reminded_at' => now(),
        ]);

        return back()->with('success', 'Pengingat pelunasan berhasil dikirim ke mentee.');
    }

    public function remindAll(Request $request)
    {
        $sessions = MentoringSession::with(['student', 'mentor'])
            ->where('is_free_session', false)
            ->whereIn('status', ['berlangsung', 'selesai'])
            ->whereIn('payment_final_status', ['belum_dibayar', 'ditolak'])
            ->where(function ($query) {
                $query->whereNull('payment_final_reminded_at')
                    ->orWhere('payment_final_reminded_at', '<=', now()->subHours(24));
            })
            ->get();

        $count = 0;
        $now = now();

        foreach ($sessions as $session) {
            $mentorName = $session->mentor?->name ?? 'Mentor';
            $message = "Pengingat: sisa pelunasan 50% untuk sesi mentoring bersama {$mentorName} belum dibayar. Silakan upload bukti pelunasan.";

            $session->student?->notify(new SessionEvent($message, '/bookings'));
            $session->update([
                'payment_final_reminded_at' => $now,
            ]);
            $count++;
        }

        return back()->with('success', "Berhasil mengirim {$count} pengingat pelunasan ke mentee.");
    }

    private function formatSession(MentoringSession $session): array
    {
        $canRemind = $session->payment_final_reminded_at === null
            || $session->payment_final_reminded_at->lte(now()->subHours(24));

        return [
            'id' => $session->id,
            'status' => $session->status,
            'payment_final_status' => $session->payment_final_status,
            'schedule_time' => $session->schedule_time?->format('d M Y, H:i'),
            'price_snapshot' => $session->price_snapshot,
            'final_amount' => $session->price_snapshot ? (float) $session->price_snapshot * 0.5 : 0,
            'remaining_amount' => $session->price_snapshot ? (float) $session->price_snapshot * 0.5 : 0,
            'payment_final_reminded_at' => $session->payment_final_reminded_at?->format('d M Y, H:i'),
            'payment_final_reminded_at_iso' => $session->payment_final_reminded_at?->toISOString(),
            'can_remind' => $canRemind,
            'student' => [
                'id' => $session->student?->id,
                'name' => $session->student?->name ?? '-',
                'email' => $session->student?->email ?? '-',
            ],
            'mentor' => [
                'id' => $session->mentor?->id,
                'name' => $session->mentor?->name ?? '-',
                'email' => $session->mentor?->email ?? '-',
            ],
        ];
    }
}


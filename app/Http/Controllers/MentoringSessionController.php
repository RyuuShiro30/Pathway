<?php

namespace App\Http\Controllers;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class MentoringSessionController extends Controller
{
    // POST - mentee bikin booking baru
    public function store(Request $request)
    {
        $validated = $request->validate([
            'mentor_id' => 'required|exists:users,id',
            'schedule_time' => 'required|date|after:now',
            'duration_hours' => 'required|integer|min:1|max:4',
            'notes_from_student' => 'nullable|string',
        ]);

        $bookingStart = Carbon::parse($validated['schedule_time'])
            ->setTimezone('Asia/Jakarta');
        $bookingEnd = $bookingStart->copy()->addHours($validated['duration_hours']);
        $bookingStartUtc = $bookingStart->copy()->setTimezone('UTC');
        $bookingEndUtc = $bookingEnd->copy()->setTimezone('UTC');
        $bookingStaysOnLocalDate = $bookingStart->isSameDay($bookingEnd);
        $weekday = [
            1 => 'senin',
            2 => 'selasa',
            3 => 'rabu',
            4 => 'kamis',
            5 => 'jumat',
            6 => 'sabtu',
            7 => 'minggu',
        ][$bookingStart->dayOfWeekIso];
        $bookingStartMinutes = ($bookingStart->hour * 60) + $bookingStart->minute;
        $bookingEndMinutes = ($bookingEnd->hour * 60) + $bookingEnd->minute;

        return DB::transaction(function () use (
            $request,
            $validated,
            $bookingStartUtc,
            $bookingEndUtc,
            $bookingStaysOnLocalDate,
            $weekday,
            $bookingStartMinutes,
            $bookingEndMinutes,
        ) {
            $mentorProfile = MentorProfile::query()
                ->where('user_id', $validated['mentor_id'])
                ->lockForUpdate()
                ->first();

            $matchingSlot = null;

            foreach ($mentorProfile?->availability_schedule ?? [] as $slot) {
                if (! is_array($slot) || ($slot['day'] ?? null) !== $weekday) {
                    continue;
                }

                $slotStartMinutes = $this->timeToMinutes($slot['start'] ?? null);
                $slotEndMinutes = $this->timeToMinutes($slot['end'] ?? null);
                $slotType = $slot['type'] ?? 'gratis';

                if (
                    $slotStartMinutes === null
                    || $slotEndMinutes === null
                    || ! $bookingStaysOnLocalDate
                    || ! in_array($slotType, ['gratis', 'berbayar'], true)
                    || $bookingStartMinutes < $slotStartMinutes
                    || $bookingEndMinutes > $slotEndMinutes
                ) {
                    continue;
                }

                if (
                    $slotType === 'berbayar'
                    && (! is_int($slot['price'] ?? null) || $slot['price'] < 1000)
                ) {
                    continue;
                }

                $matchingSlot = $slot;
                break;
            }

            if ($matchingSlot === null) {
                throw ValidationException::withMessages([
                    'schedule_time' => 'Jadwal tidak tersedia.',
                ]);
            }

            $isFreeSession = ($matchingSlot['type'] ?? 'gratis') === 'gratis';
            $pricePerHour = $isFreeSession ? 0 : $matchingSlot['price'];
            $totalPrice = $pricePerHour * $validated['duration_hours'];

            $request->validate([
                'payment_dp_proof' => $isFreeSession
                    ? 'nullable|image|max:5120'
                    : 'required|image|max:5120',
            ]);

            // Reject every intersection, including a previous booking that contains this entire interval.
            $conflict = MentoringSession::query()
                ->where('mentor_id', $validated['mentor_id'])
                ->whereIn('status', ['diajukan', 'dikonfirmasi', 'berlangsung'])
                ->where('schedule_time', '<', $bookingEndUtc)
                ->where('end_time', '>', $bookingStartUtc)
                ->lockForUpdate()
                ->exists();

            if ($conflict) {
                throw ValidationException::withMessages([
                    'schedule_time' => 'Slot ini baru saja dibooking pengguna lain, silakan pilih slot lain.',
                ]);
            }

            $dpProofPath = null;
            if ($request->hasFile('payment_dp_proof')) {
                $dpProofPath = $request->file('payment_dp_proof')->store('payment-proofs', 'public');
            }

            $session = MentoringSession::create([
                'student_id' => Auth::id(),
                'mentor_id' => $validated['mentor_id'],
                'status' => 'diajukan',
                'schedule_time' => $bookingStartUtc,
                'end_time' => $bookingEndUtc,
                'duration_hours' => $validated['duration_hours'],
                'notes_from_student' => $validated['notes_from_student'] ?? null,
                'is_free_session' => $isFreeSession,
                'price_snapshot' => $totalPrice,
                'payment_dp_proof' => $dpProofPath,
                'payment_dp_status' => $isFreeSession ? 'tidak_berlaku' : 'menunggu_verifikasi',
            ]);

            return redirect()->back()->with('success', 'Booking berhasil diajukan, menunggu konfirmasi mentor.');
        });
    }

    private function timeToMinutes(mixed $time): ?int
    {
        if (! is_string($time) || ! preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time)) {
            return null;
        }

        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return ($hours * 60) + $minutes;
    }

    // GET - list permintaan bimbingan baru (status: diajukan) untuk Dashboard
    public function requests()
    {
        $requests = MentoringSession::with('student')
            ->where('mentor_id', Auth::id())
            ->where('status', 'diajukan')
            ->orderBy('schedule_time', 'asc')
            ->get();

        return response()->json($requests);
    }

    // GET - tampilkan halaman detail satu permintaan booking
    public function show($id)
    {
        $session = MentoringSession::with('student')
            ->where('mentor_id', Auth::id())
            ->findOrFail($id);

        return Inertia::render('Mentor/BookingRequestDetail', [
            'session' => $session,
        ]);
    }

    // PATCH - mentor verifikasi & terima, atau tolak permintaan
    public function respond(Request $request, $id)
    {
        $request->validate([
            'action' => 'required|in:terima,tolak',
        ]);

        $session = MentoringSession::where('mentor_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();

        if ($session->status !== 'diajukan') {
            return redirect()->back()->withErrors([
                'message' => 'Sesi ini sudah tidak dalam status diajukan',
            ]);
        }

        if ($request->action === 'tolak') {
            $session->update(['status' => 'dibatalkan', 'cancelled_by' => 'mentor']);

            return redirect()->route('mentor.dashboard')->with('success', 'Permintaan berhasil ditolak');
        }

        // Action: terima
        $mentorProfile = $session->mentor->mentorProfile;

        $session->update([
            'status' => 'dikonfirmasi',
            'discord_link' => $mentorProfile->discord_room_link,
            'payment_dp_status' => $session->is_free_session ? 'tidak_berlaku' : 'terverifikasi',
        ]);

        // TODO: kirim email ke mentee berisi link Discord (nanti ditambahkan)

        return redirect()->route('mentor.dashboard')->with('success', 'Booking berhasil dikonfirmasi');
    }

    // GET - halaman session tracking untuk 1 sesi yang sudah dikonfirmasi
    public function tracking($id)
    {
        $session = MentoringSession::with('student')
            ->where('mentor_id', Auth::id())
            ->whereIn('status', ['dikonfirmasi', 'berlangsung', 'selesai'])
            ->findOrFail($id);

        return Inertia::render('Mentor/SessionTracking', [
            'session' => $session,
        ]);
    }

    // GET - halaman proses refund untuk mentor
    public function refundForm($id)
    {
        $session = MentoringSession::with('student')
            ->where('mentor_id', Auth::id())
            ->where('refund_status', 'menunggu')
            ->findOrFail($id);

        return Inertia::render('Mentor/RefundProcess', [
            'session' => $session,
        ]);
    }

    // PATCH - mentor klik "Mulai Sesi"
    public function startSession($id)
    {
        $session = MentoringSession::where('mentor_id', Auth::id())
            ->where('id', $id)
            ->where('status', 'dikonfirmasi')
            ->firstOrFail();

        $session->update(['status' => 'berlangsung']);

        return redirect()->back()->with('success', 'Sesi dimulai');
    }

    // PATCH - mentor submit bukti mentoring dan selesaikan sesi
    public function completeSession(Request $request, $id)
    {
        $request->validate([
            'proof_file' => 'required|image|max:5120',
            'notes_from_mentor' => 'nullable|string',
        ]);

        $session = MentoringSession::where('mentor_id', Auth::id())
            ->where('id', $id)
            ->where('status', 'berlangsung')
            ->firstOrFail();

        $proofPath = $request->file('proof_file')->store('session-proofs', 'public');

        $session->update([
            'status' => 'selesai',
            'proof_file' => $proofPath,
            'notes_from_mentor' => $request->notes_from_mentor,
        ]);

        return redirect()->route('mentor.dashboard')->with('success', 'Sesi berhasil diselesaikan');
    }

    public function cancelSession(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'cancellation_reason' => ['required', 'string'],
        ]);

        DB::transaction(function () use ($id, $validated): void {
            $session = MentoringSession::query()
                ->where('mentor_id', Auth::id())
                ->whereKey($id)
                ->where('status', 'dikonfirmasi')
                ->lockForUpdate()
                ->firstOrFail();

            $cancellation = [
                'status' => 'dibatalkan',
                'cancelled_by' => 'mentor',
                'cancellation_reason' => $validated['cancellation_reason'],
            ];

            if (! $session->is_free_session) {
                $cancellation['refund_status'] = 'menunggu';
                $cancellation['refund_deadline'] = Carbon::now()->addHours(48);
            }

            $session->update($cancellation);
        });

        return redirect()->route('mentor.dashboard')->with('success', 'Sesi berhasil dibatalkan.');
    }

    // PATCH - mentor upload bukti transfer refund ke mentee
    public function completeRefund(Request $request, $id)
    {
        $request->validate([
            'refund_proof' => 'required|file|mimes:jpg,jpeg,png,pdf|max:5120',
        ]);

        $session = MentoringSession::where('mentor_id', Auth::id())
            ->where('id', $id)
            ->where('refund_status', 'menunggu')
            ->firstOrFail();

        $proofPath = $request->file('refund_proof')->store('refund-proofs', 'public');

        $session->update([
            'refund_proof' => $proofPath,
            'refund_status' => 'menunggu_konfirmasi',
            'refund_proof_uploaded_at' => now(),
        ]);

        return redirect()->route('mentor.dashboard')->with('success', 'Bukti refund berhasil diupload, menunggu konfirmasi mentee');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class MentoringSessionController extends Controller
{
    public function studentIndex(): InertiaResponse
    {
        $studentId = Auth::id();
        $stats = MentoringSession::query()
            ->where('student_id', $studentId)
            ->selectRaw(
                'COUNT(*) as total,
                COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) as menunggu_konfirmasi,
                COALESCE(SUM(CASE WHEN status = ? THEN 1 ELSE 0 END), 0) as siap_datang,
                COALESCE(SUM(CASE WHEN status = ? THEN duration_hours ELSE 0 END), 0) as jam_mentoring',
                ['diajukan', 'dikonfirmasi', 'selesai'],
            )
            ->first();

        $bookings = MentoringSession::query()
            ->where('student_id', $studentId)
            ->with([
                'mentor:id,name',
                'mentor.mentorProfile:user_id,expertise',
            ])
            ->select([
                'id',
                'mentor_id',
                'status',
                'schedule_time',
                'end_time',
                'duration_hours',
                'is_free_session',
                'price_snapshot',
                'payment_dp_status',
                'refund_status',
                'refund_proof',
                'refund_proof_uploaded_at',
                'cancelled_by',
                'discord_link',
            ])
            ->orderByDesc('schedule_time')
            ->limit(100)
            ->get()
            ->map(static function (MentoringSession $session): array {
                $isAwaitingRefundConfirmation = $session->refund_status === 'menunggu_konfirmasi';

                return [
                    'id' => $session->id,
                    'status' => $session->status,
                    'schedule_time' => $session->schedule_time
                        ->copy()
                        ->setTimezone('UTC')
                        ->toISOString(),
                    'end_time' => $session->end_time?->copy()
                        ->setTimezone('UTC')
                        ->toISOString(),
                    'duration_hours' => $session->duration_hours,
                    'is_free_session' => $session->is_free_session,
                    'price_snapshot' => $session->price_snapshot,
                    'payment_dp_status' => $session->payment_dp_status,
                    'refund_status' => $session->refund_status,
                    'refund_proof_path' => $isAwaitingRefundConfirmation
                        ? $session->refund_proof
                        : null,
                    'refund_proof_uploaded_at' => $isAwaitingRefundConfirmation
                        ? $session->refund_proof_uploaded_at?->copy()->setTimezone('UTC')->toISOString()
                        : null,
                    'cancelled_by' => $session->cancelled_by,
                    'mentor' => [
                        'id' => $session->mentor->id,
                        'name' => $session->mentor->name,
                        'expertise' => $session->mentor->mentorProfile?->expertise,
                    ],
                    'discord_link' => in_array(
                        $session->status,
                        ['dikonfirmasi', 'berlangsung'],
                        true,
                    ) ? $session->discord_link : null,
                ];
            })
            ->values();

        return Inertia::render('Student/MyBookings', [
            'bookings' => $bookings,
            'stats' => [
                'total' => (int) $stats->total,
                'menunggu_konfirmasi' => (int) $stats->menunggu_konfirmasi,
                'siap_datang' => (int) $stats->siap_datang,
                'jam_mentoring' => (int) $stats->jam_mentoring,
            ],
        ]);
    }

    public function cancelBooking(Request $request, int $id): RedirectResponse
    {
        $reason = $request->input('cancellation_reason');
        $request->merge([
            'cancellation_reason' => is_string($reason) ? trim($reason) : $reason,
        ]);

        $validated = $request->validate([
            'cancellation_reason' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($id, $validated): void {
            $session = MentoringSession::query()
                ->where('student_id', Auth::id())
                ->whereKey($id)
                ->where('status', 'diajukan')
                ->lockForUpdate()
                ->firstOrFail();

            $cancellation = [
                'status' => 'dibatalkan',
                'cancelled_by' => 'mentee',
                'cancellation_reason' => $validated['cancellation_reason'],
            ];

            if (! $session->is_free_session) {
                $cancellation['refund_status'] = 'menunggu';
                $cancellation['refund_deadline'] = Carbon::now()->addHours(48);
            }

            $session->update($cancellation);
        });

        return redirect()->route('student.bookings.index')
            ->with('success', 'Pengajuan berhasil dibatalkan.');
    }

    public function confirmRefund(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:sudah_terima,belum_terima'],
        ]);

        $newRefundStatus = $validated['decision'] === 'sudah_terima' ? 'selesai' : 'dilaporkan';

        DB::transaction(function () use ($id, $newRefundStatus): void {
            $session = MentoringSession::query()
                ->where('student_id', Auth::id())
                ->whereKey($id)
                ->where('refund_status', 'menunggu_konfirmasi')
                ->lockForUpdate()
                ->firstOrFail();

            $session->update([
                'refund_status' => $newRefundStatus,
            ]);
        });

        $message = $validated['decision'] === 'sudah_terima'
            ? 'Terima kasih, refund Anda sudah dikonfirmasi.'
            : 'Laporan Anda sudah dikirim.';

        return redirect()->route('student.bookings.index')
            ->with('success', $message);
    }

    public function schedule(User $mentor): InertiaResponse
    {
        $mentorProfile = $this->mentorProfileForBooking($mentor);
        $from = Carbon::now('Asia/Jakarta')->startOfDay();
        $until = $from->copy()->addDays(10);
        $bookingWindowEnd = $until->copy()->addDay();
        $busySessions = MentoringSession::query()
            ->where('mentor_id', $mentor->id)
            ->whereIn('status', ['diajukan', 'dikonfirmasi', 'berlangsung'])
            ->where('schedule_time', '<', $bookingWindowEnd->copy()->setTimezone('UTC'))
            ->where('end_time', '>', $from->copy()->setTimezone('UTC'))
            ->orderBy('schedule_time')
            ->get(['schedule_time', 'end_time'])
            ->map(static fn (MentoringSession $session): array => [
                'schedule_time' => $session->schedule_time
                    ->copy()
                    ->setTimezone('UTC')
                    ->toISOString(),
                'end_time' => $session->end_time
                    ->copy()
                    ->setTimezone('UTC')
                    ->toISOString(),
            ])
            ->all();

        $mentorData = [
            'id' => $mentor->id,
            'name' => $mentor->name,
            'expertise' => $mentorProfile->expertise,
            'bio' => $mentorProfile->bio,
            'portfolio_url' => $mentorProfile->portfolio_url,
            'avg_rating' => $mentorProfile->avg_rating,
            'is_available' => $mentorProfile->is_available,
            'availability_schedule' => $this->normalizeAvailabilitySchedule(
                $mentorProfile->availability_schedule,
            ),
        ];

        return Inertia::render('Student/BookingSchedule', [
            'mentor' => $mentorData,
            'busy_sessions' => $busySessions,
            'booking_window' => [
                'from' => $from->toDateString(),
                'until' => $until->toDateString(),
            ],
        ]);
    }

    public function confirm(Request $request, User $mentor): InertiaResponse|RedirectResponse
    {
        $mentorProfile = $this->mentorProfileForBooking($mentor);
        $validator = validator($request->query(), [
            'date' => 'required|date_format:Y-m-d',
            'start' => 'required|date_format:H:i',
            'duration_hours' => 'required|integer|min:1|max:2',
        ], [
            'date.required' => 'Tanggal booking wajib dipilih.',
            'date.date_format' => 'Tanggal booking tidak valid.',
            'start.required' => 'Waktu mulai wajib dipilih.',
            'start.date_format' => 'Waktu mulai tidak valid.',
            'duration_hours.required' => 'Durasi wajib dipilih.',
            'duration_hours.integer' => 'Durasi harus berupa bilangan bulat.',
            'duration_hours.min' => 'Durasi minimal 1 jam.',
            'duration_hours.max' => 'Durasi maksimal 2 jam.',
        ]);

        if ($validator->fails()) {
            return $this->redirectToScheduleWithBookingError(
                $mentor,
                $validator->errors()->first(),
            );
        }

        $validated = $validator->validated();
        $bookingStart = Carbon::parse(
            "{$validated['date']} {$validated['start']}",
            'Asia/Jakarta',
        );
        $durationHours = (int) $validated['duration_hours'];

        if (! $this->isWithinBookingWindow($bookingStart)) {
            return $this->redirectToScheduleWithBookingError(
                $mentor,
                'Jadwal booking hanya dapat dipilih maksimal 10 hari ke depan.',
            );
        }

        try {
            $booking = $this->resolveBookingDetails(
                $mentorProfile,
                $bookingStart,
                $durationHours,
            );
        } catch (ValidationException $exception) {
            return $this->redirectToScheduleWithBookingError(
                $mentor,
                $exception->errors()['schedule_time'][0],
            );
        }

        if ($booking === null) {
            return $this->redirectToScheduleWithBookingError(
                $mentor,
                'Jadwal tidak tersedia.',
            );
        }

        if (! $booking['is_free_session'] && ! $this->hasCompletePaymentAccount($mentor)) {
            return $this->redirectToScheduleWithBookingError(
                $mentor,
                'Mentor belum mengisi rekening untuk menerima DP.',
            );
        }

        if ($this->hasBookingConflict(
            $mentor->id,
            $booking['schedule_time'],
            $booking['end_time'],
        )) {
            return $this->redirectToScheduleWithBookingError(
                $mentor,
                'Slot ini baru saja dibooking pengguna lain, silakan pilih slot lain.',
            );
        }

        return Inertia::render('Student/BookingConfirm', [
            'mentor' => [
                'id' => $mentor->id,
                'name' => $mentor->name,
            ],
            'summary' => [
                'date' => $booking['date'],
                'start' => $booking['start'],
                'end' => $booking['end'],
                'duration_hours' => $booking['duration_hours'],
                'is_free_session' => $booking['is_free_session'],
                'price_per_hour' => $booking['price_per_hour'],
                'total_price' => $booking['total_price'],
                'dp_amount' => $booking['dp_amount'],
            ],
            'payment_account' => $booking['is_free_session']
                ? null
                : [
                    'bank_name' => $mentor->bank_name,
                    'account_number' => $mentor->bank_account_number,
                    'account_holder' => $mentor->bank_account_holder,
                ],
        ]);
    }

    // POST - mentee bikin booking baru
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'mentor_id' => 'required|exists:users,id',
            'schedule_time' => 'required|date_format:Y-m-d\TH:i:sP|after:now',
            'duration_hours' => 'required|integer|min:1|max:2',
            'notes_from_student' => 'nullable|string',
        ], [
            'schedule_time.required' => 'Jadwal booking wajib dipilih.',
            'schedule_time.date_format' => 'Jadwal booking harus menggunakan format ISO 8601 dengan zona waktu.',
            'schedule_time.after' => 'Jadwal booking harus setelah waktu sekarang.',
            'duration_hours.required' => 'Durasi wajib dipilih.',
            'duration_hours.integer' => 'Durasi harus berupa bilangan bulat.',
            'duration_hours.min' => 'Durasi minimal 1 jam.',
            'duration_hours.max' => 'Durasi maksimal 2 jam.',
        ]);

        $bookingStart = Carbon::parse($validated['schedule_time'], 'UTC');

        if (! $this->isWithinBookingWindow($bookingStart)) {
            throw ValidationException::withMessages([
                'schedule_time' => 'Jadwal booking hanya dapat dipilih maksimal 10 hari ke depan.',
            ]);
        }

        return DB::transaction(function () use (
            $request,
            $validated,
            $bookingStart,
        ) {
            $mentorProfile = MentorProfile::query()
                ->where('user_id', $validated['mentor_id'])
                ->lockForUpdate()
                ->firstOrFail();
            abort_if((int) $validated['mentor_id'] === (int) Auth::id(), 403);
            $booking = $this->resolveBookingDetails(
                $mentorProfile,
                $bookingStart,
                (int) $validated['duration_hours'],
            );

            if ($booking === null) {
                throw ValidationException::withMessages([
                    'schedule_time' => 'Jadwal tidak tersedia.',
                ]);
            }

            if (! $booking['is_free_session']) {
                $mentor = User::query()
                    ->whereKey($validated['mentor_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                if (! $this->hasCompletePaymentAccount($mentor)) {
                    throw ValidationException::withMessages([
                        'schedule_time' => 'Mentor belum mengisi rekening untuk menerima DP.',
                    ]);
                }
            }

            $request->validate([
                'payment_dp_proof' => [
                    $booking['is_free_session'] ? 'nullable' : 'required',
                    'mimes:jpg,jpeg,png',
                    'max:5120',
                ],
            ]);

            if ($this->hasBookingConflict(
                (int) $validated['mentor_id'],
                $booking['schedule_time'],
                $booking['end_time'],
                true,
            )) {
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
                'schedule_time' => $booking['schedule_time'],
                'end_time' => $booking['end_time'],
                'duration_hours' => $validated['duration_hours'],
                'notes_from_student' => $validated['notes_from_student'] ?? null,
                'is_free_session' => $booking['is_free_session'],
                'price_snapshot' => $booking['total_price'],
                'payment_dp_proof' => $dpProofPath,
                'payment_dp_status' => $booking['is_free_session']
                    ? 'tidak_berlaku'
                    : 'menunggu_verifikasi',
            ]);

            return redirect()
                ->route('student.bookings.index')
                ->with('success', 'Booking berhasil diajukan, menunggu konfirmasi mentor.');
        });
    }

    /**
     * @return array{
     *     date: string,
     *     start: string,
     *     end: string,
     *     duration_hours: int,
     *     is_free_session: bool,
     *     price_per_hour: int|null,
     *     total_price: int,
     *     dp_amount: int,
     *     schedule_time: Carbon,
     *     end_time: Carbon
     * }|null
     */
    private function resolveBookingDetails(
        MentorProfile $mentorProfile,
        Carbon $bookingStart,
        int $durationHours,
    ): ?array {
        $bookingStart = $bookingStart->copy()->setTimezone('Asia/Jakarta');
        $bookingEnd = $bookingStart->copy()->addHours($durationHours);

        if (! $bookingStart->isSameDay($bookingEnd)) {
            return null;
        }

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
        $hourlyTypes = [];
        $hourlyPrices = [];

        for ($hour = 0; $hour < $durationHours; $hour++) {
            $hourStartMinutes = $bookingStartMinutes + ($hour * 60);
            $hourEndMinutes = $hourStartMinutes + 60;
            $matchingSlot = null;

            foreach ($mentorProfile->availability_schedule ?? [] as $slot) {
                if (! is_array($slot) || ($slot['day'] ?? null) !== $weekday) {
                    continue;
                }

                $slotStartMinutes = $this->timeToMinutes($slot['start'] ?? null);
                $slotEndMinutes = $this->timeToMinutes($slot['end'] ?? null);
                $slotType = $slot['type'] ?? 'gratis';

                if (
                    $slotStartMinutes === null
                    || $slotEndMinutes === null
                    || ! in_array($slotType, ['gratis', 'berbayar'], true)
                    || $hourStartMinutes < $slotStartMinutes
                    || $hourEndMinutes > $slotEndMinutes
                    || (
                        $slotType === 'berbayar'
                        && (! is_int($slot['price'] ?? null) || $slot['price'] < 1000)
                    )
                ) {
                    continue;
                }

                $matchingSlot = $slot;
                break;
            }

            if ($matchingSlot === null) {
                return null;
            }

            $hourlyTypes[] = $matchingSlot['type'] ?? 'gratis';
            $hourlyPrices[] = ($matchingSlot['type'] ?? 'gratis') === 'gratis'
                ? 0
                : $matchingSlot['price'];
        }

        if (count(array_unique($hourlyTypes)) > 1) {
            throw ValidationException::withMessages([
                'schedule_time' => 'Jam yang dipilih harus bertipe sama (semua gratis atau semua berbayar).',
            ]);
        }

        $isFreeSession = $hourlyTypes[0] === 'gratis';
        $totalPrice = array_sum($hourlyPrices);
        $pricePerHour = $isFreeSession || count(array_unique($hourlyPrices)) === 1
            ? $hourlyPrices[0]
            : null;

        return [
            'date' => $bookingStart->toDateString(),
            'start' => $bookingStart->format('H:i'),
            'end' => $bookingEnd->format('H:i'),
            'duration_hours' => $durationHours,
            'is_free_session' => $isFreeSession,
            'price_per_hour' => $pricePerHour,
            'total_price' => $totalPrice,
            'dp_amount' => $isFreeSession ? 0 : (int) ceil($totalPrice * 0.5),
            'schedule_time' => $bookingStart->copy()->setTimezone('UTC'),
            'end_time' => $bookingEnd->copy()->setTimezone('UTC'),
        ];
    }

    private function mentorProfileForBooking(User $mentor): MentorProfile
    {
        $mentorProfile = $mentor->mentorProfile()->first();

        abort_if($mentorProfile === null, 404);
        abort_if((int) $mentor->getKey() === (int) Auth::id(), 403);

        return $mentorProfile;
    }

    private function hasCompletePaymentAccount(User $mentor): bool
    {
        return trim((string) $mentor->bank_name) !== ''
            && trim((string) $mentor->bank_account_number) !== ''
            && trim((string) $mentor->bank_account_holder) !== '';
    }

    private function isWithinBookingWindow(Carbon $bookingStart): bool
    {
        $now = Carbon::now('Asia/Jakarta');
        $bookingStart = $bookingStart->copy()->setTimezone('Asia/Jakarta');

        return $bookingStart->gt($now)
            && $bookingStart->lte($now->copy()->addDays(10)->endOfDay());
    }

    private function hasBookingConflict(
        int $mentorId,
        Carbon $bookingStart,
        Carbon $bookingEnd,
        bool $lockForUpdate = false,
    ): bool {
        $query = MentoringSession::query()
            ->where('mentor_id', $mentorId)
            ->whereIn('status', ['diajukan', 'dikonfirmasi', 'berlangsung'])
            ->where('schedule_time', '<', $bookingEnd)
            ->where('end_time', '>', $bookingStart);

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        return $query->exists();
    }

    private function normalizeAvailabilitySchedule(?array $availabilitySchedule): array
    {
        $normalizedSchedule = [];

        foreach ($availabilitySchedule ?? [] as $slot) {
            if (! is_array($slot)) {
                continue;
            }

            $type = $slot['type'] ?? 'gratis';
            $slot['type'] = $type;
            $slot['price'] = $type === 'gratis' ? null : ($slot['price'] ?? null);
            $normalizedSchedule[] = $slot;
        }

        return $normalizedSchedule;
    }

    private function redirectToScheduleWithBookingError(
        User $mentor,
        string $message,
    ): RedirectResponse {
        return redirect()
            ->route('student.booking.schedule', ['mentor' => $mentor->getKey()])
            ->withErrors(['schedule_time' => $message]);
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

        return DB::transaction(function () use ($request, $id) {
            $session = MentoringSession::where('mentor_id', Auth::id())
                ->where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($session->status !== 'diajukan') {
                return redirect()->back()->withErrors([
                    'message' => 'Sesi ini sudah tidak dalam status diajukan',
                ]);
            }

            if ($request->action === 'terima' && $session->schedule_time->isPast()) {
                return redirect()->back()->withErrors([
                    'message' => 'Jadwal sesi sudah lewat, pengajuan ini tidak dapat diterima.',
                ]);
            }

            if ($request->action === 'tolak') {
                $cancellation = [
                    'status' => 'dibatalkan',
                    'cancelled_by' => 'mentor',
                ];

                if (! $session->is_free_session) {
                    $cancellation['refund_status'] = 'menunggu';
                    $cancellation['refund_deadline'] = Carbon::now()->addHours(48);
                }

                $session->update($cancellation);

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
        });
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

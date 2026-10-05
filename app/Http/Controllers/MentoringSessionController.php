<?php

namespace App\Http\Controllers;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MentoringSessionController extends Controller
{
    // POST - mentee bikin booking baru
    public function store(Request $request)
    {
        $request->validate([
            'mentor_id' => 'required|exists:users,id',
            'schedule_time' => 'required|date|after:now',
            'duration_hours' => 'required|integer|min:1|max:4',
            'is_free_session' => 'required|boolean',
            'notes_from_student' => 'nullable|string',
            'payment_dp_proof' => 'required_if:is_free_session,false|image|max:5120',
        ]);

        $endTime = \Carbon\Carbon::parse($request->schedule_time)
            ->addHours($request->duration_hours);

        return DB::transaction(function () use ($request, $endTime) {
            // Cek slot bentrok (race condition protection)
            $conflict = MentoringSession::where('mentor_id', $request->mentor_id)
                ->whereIn('status', ['diajukan', 'dikonfirmasi', 'berlangsung'])
                ->where(function ($query) use ($request, $endTime) {
                    $query->whereBetween('schedule_time', [$request->schedule_time, $endTime])
                        ->orWhereBetween('end_time', [$request->schedule_time, $endTime]);
                })
                ->lockForUpdate()
                ->exists();

            if ($conflict) {
                throw ValidationException::withMessages([
                    'schedule_time' => 'Slot ini baru saja dibooking pengguna lain, silakan pilih slot lain.',
                ]);
            }

            $mentorProfile = MentorProfile::where('user_id', $request->mentor_id)->first();
            $pricePerHour = $mentorProfile->price_per_session ?? 0;
            $totalPrice = $request->is_free_session ? 0 : $pricePerHour * $request->duration_hours;

            $dpProofPath = null;
            if ($request->hasFile('payment_dp_proof')) {
                $dpProofPath = $request->file('payment_dp_proof')->store('payment-proofs', 'public');
            }

            $session = MentoringSession::create([
                'student_id' => Auth::id(),
                'mentor_id' => $request->mentor_id,
                'status' => 'diajukan',
                'schedule_time' => $request->schedule_time,
                'end_time' => $endTime,
                'duration_hours' => $request->duration_hours,
                'notes_from_student' => $request->notes_from_student,
                'is_free_session' => $request->is_free_session,
                'price_snapshot' => $totalPrice,
                'payment_dp_proof' => $dpProofPath,
                'payment_dp_status' => $request->is_free_session ? 'tidak_berlaku' : 'menunggu_verifikasi',
            ]);

            return redirect()->back()->with('success', 'Booking berhasil diajukan, menunggu konfirmasi mentor.');
        });
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

        return \Inertia\Inertia::render('Mentor/BookingRequestDetail', [
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
}
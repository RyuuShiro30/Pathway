<?php

namespace App\Http\Controllers;

use App\Models\MentoringSession;
use App\Models\MentorProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MentorProfileController extends Controller
{
    // Buka halaman Dashboard Mentor
    public function dashboard()
    {
        $mentorProfile = MentorProfile::where('user_id', Auth::id())->first();

        $requests = MentoringSession::with('student')
            ->where('mentor_id', Auth::id())
            ->where('status', 'diajukan')
            ->orderBy('schedule_time', 'asc')
            ->get();

        return Inertia::render('Mentor/Dashboard', [
            'mentorProfile' => $mentorProfile,
            'bookingRequests' => $requests,
        ]);
    }

    // Aksi: update jadwal ketersediaan (dipanggil saat mentor klik "Simpan")
    public function updateAvailability(Request $request)
    {
        $validated = $request->validate([
            'availability_schedule' => 'present|array',
            'availability_schedule.*.day' => 'required|string|in:senin,selasa,rabu,kamis,jumat,sabtu,minggu',
            'availability_schedule.*.start' => 'required|date_format:H:i',
            'availability_schedule.*.end' => 'required|date_format:H:i|after:availability_schedule.*.start',
            'availability_schedule.*.type' => 'required|in:gratis,berbayar',
            'availability_schedule.*.price' => 'exclude_unless:availability_schedule.*.type,berbayar|required|integer|min:1000',
        ], [
            'availability_schedule.present' => 'Jadwal ketersediaan wajib dikirim.',
            'availability_schedule.array' => 'Format jadwal ketersediaan tidak valid.',
            'availability_schedule.*.day.required' => 'Hari wajib dipilih.',
            'availability_schedule.*.day.string' => 'Hari harus berupa teks.',
            'availability_schedule.*.day.in' => 'Hari harus salah satu dari Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, atau Minggu.',
            'availability_schedule.*.start.required' => 'Waktu mulai wajib diisi.',
            'availability_schedule.*.start.date_format' => 'Waktu mulai harus menggunakan format HH:MM.',
            'availability_schedule.*.end.required' => 'Waktu selesai wajib diisi.',
            'availability_schedule.*.end.date_format' => 'Waktu selesai harus menggunakan format HH:MM.',
            'availability_schedule.*.end.after' => 'Waktu selesai harus setelah waktu mulai.',
            'availability_schedule.*.type.required' => 'Tipe slot wajib dipilih.',
            'availability_schedule.*.type.in' => 'Tipe slot harus Gratis atau Berbayar.',
            'availability_schedule.*.price.required' => 'Harga wajib diisi untuk slot berbayar.',
            'availability_schedule.*.price.integer' => 'Harga slot harus berupa bilangan bulat.',
            'availability_schedule.*.price.min' => 'Harga slot berbayar minimal Rp 1.000.',
        ]);

        $minutes = static function (string $time): int {
            [$hours, $minutes] = array_map('intval', explode(':', $time));

            return ($hours * 60) + $minutes;
        };
        $dayLabels = [
            'senin' => 'Senin',
            'selasa' => 'Selasa',
            'rabu' => 'Rabu',
            'kamis' => 'Kamis',
            'jumat' => 'Jumat',
            'sabtu' => 'Sabtu',
            'minggu' => 'Minggu',
        ];

        $availabilitySchedule = array_values($validated['availability_schedule']);

        foreach ($availabilitySchedule as $firstIndex => $firstSlot) {
            foreach (array_slice($availabilitySchedule, $firstIndex + 1) as $secondSlot) {
                if (
                    $firstSlot['day'] !== $secondSlot['day']
                    || $minutes($firstSlot['start']) >= $minutes($secondSlot['end'])
                    || $minutes($firstSlot['end']) <= $minutes($secondSlot['start'])
                ) {
                    continue;
                }

                return redirect()->back()->withErrors([
                    'availability_schedule' => sprintf(
                        'Jadwal pada hari %s saling tumpang tindih: %s-%s dan %s-%s.',
                        $dayLabels[$firstSlot['day']],
                        $firstSlot['start'],
                        $firstSlot['end'],
                        $secondSlot['start'],
                        $secondSlot['end'],
                    ),
                ]);
            }
        }

        $mentorProfile = MentorProfile::where('user_id', Auth::id())->first();

        if (! $mentorProfile) {
            return redirect()->back()->withErrors(['message' => 'Profil mentor belum ditemukan']);
        }

        $mentorProfile->update([
            'availability_schedule' => array_map(
                static fn (array $slot): array => [
                    'day' => $slot['day'],
                    'start' => $slot['start'],
                    'end' => $slot['end'],
                    'type' => $slot['type'],
                    'price' => $slot['type'] === 'gratis' ? null : (int) $slot['price'],
                ],
                $validated['availability_schedule'],
            ),
        ]);

        return redirect()->back()->with('success', 'Jadwal ketersediaan berhasil diperbarui');
    }
}

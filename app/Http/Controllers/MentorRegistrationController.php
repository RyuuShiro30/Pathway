<?php

namespace App\Http\Controllers;

use App\Http\Requests\MentorRegistrationRequest;
use App\Models\MentorProfile;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MentorRegistrationController extends Controller
{
    /**
     * Menampilkan halaman pendaftaran mentor.
     */
    public function create(): Response
    {
        return Inertia::render('Mentor/Register', [
            'user' => auth()->user(),
            'mentorProfile' => auth()->user()->mentorProfile,
        ]);
    }

    /**
     * Menyimpan pendaftaran atau perubahan data mentor.
     */
    public function store(MentorRegistrationRequest $request): RedirectResponse
    {
        $user = $request->user();

        // Cek apakah user sudah memiliki profil mentor.
        $mentorProfile = $user->mentorProfile;

        // Cek apakah pengajuan sebelumnya ditolak.
        $isResubmission = $mentorProfile?->verification_status === 'rejected';

        // Update nama user.
        $user->update([
            'name' => $request->name,
        ]);

        // Jika user mengupload foto baru, simpan ke Storage.
        if ($request->hasFile('photo')) {
            // Hapus foto lama jika ada.
            if ($user->photo_path) {
                \Illuminate\Support\Facades\Storage::disk('public')
                    ->delete($user->photo_path);
            }

            // Simpan foto baru ke storage/app/public/mentor-photos.
            $user->photo_path = $request->file('photo')
                ->store('mentor-photos', 'public');

            $user->save();
        }

        // Data mentor yang akan disimpan.
        $mentorData = [
            'expertise' => $request->expertise,
            'bio' => $request->bio,
            'portfolio_url' => $request->portfolio_url,
            'mentor_type' => $request->mentor_type,
            'price_per_session' => $request->mentor_type === 'paid'
                ? $request->price_per_session
                : 0,
            'is_available' => $request->is_available,
        ];

        if ($mentorProfile) {
            // Jika sebelumnya ditolak dan mengajukan ulang,
            // status kembali menjadi pending.
            if ($isResubmission) {
                $mentorData['verification_status'] = 'pending';
            }

            // Jika pending atau verified, status tetap dipertahankan.
            $mentorProfile->update($mentorData);
        } else {
            // Jika belum pernah mendaftar, buat profil baru
            // dengan status pending.
            $mentorData['user_id'] = $user->id;
            $mentorData['verification_status'] = 'pending';

            MentorProfile::create($mentorData);
        }

        // Pesan disesuaikan dengan kondisi pendaftaran.
        if (!$mentorProfile) {
            $message = 'Pendaftaran mentor berhasil dikirim dan sedang menunggu verifikasi.';
        } elseif ($isResubmission) {
            $message = 'Pendaftaran mentor berhasil diajukan ulang dan sedang menunggu verifikasi.';
        } else {
            $message = 'Perubahan data mentor berhasil disimpan.';
        }

        return redirect()
            ->route('mentor.register')
            ->with('success', $message);
    }
}
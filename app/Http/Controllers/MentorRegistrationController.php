<?php

namespace App\Http\Controllers;


use App\Http\Requests\MentorRegistrationRequest;
use App\Models\MentorCertificate;
use Illuminate\Support\Facades\Storage;
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
            'mentorProfile' => auth()->user()->mentorProfile?->load('certificates'),
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

        // Menandai apakah ini pendaftaran baru.
        $isNewProfile = !$mentorProfile;

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

            // Simpan foto baru.
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

            // Update profil mentor.
            $mentorProfile->update($mentorData);
        } else {
            // Jika belum pernah mendaftar,
            // buat profil baru dengan status pending.
            $mentorData['user_id'] = $user->id;
            $mentorData['verification_status'] = 'pending';

            $mentorProfile = MentorProfile::create($mentorData);
        }

        // Upload banyak sertifikat atau bukti pengalaman.
        if ($request->hasFile('certificates')) {
            foreach ($request->file('certificates') as $certificate) {
                $path = $certificate->store('mentor-certificates', 'public');

                MentorCertificate::create([
                    'mentor_profile_id' => $mentorProfile->id,
                    'file_path' => $path,
                    'file_name' => $certificate->getClientOriginalName(),
                ]);
            }
        }

        // Pesan disesuaikan dengan kondisi pendaftaran.
        if ($isNewProfile) {
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

    /**
     * Menghapus sertifikat mentor.
    */
    public function destroyCertificate(
        MentorCertificate $certificate
    ): RedirectResponse {
        $user = auth()->user();

        $mentorProfile = $user->mentorProfile;

        if (
            !$mentorProfile ||
            $certificate->mentor_profile_id !== $mentorProfile->id
        ) {
            abort(403);
        }

        Storage::disk('public')->delete($certificate->file_path);

        $certificate->delete();

        return redirect()
            ->route('mentor.register')
            ->with('success', 'Sertifikat berhasil dihapus.');
    }
}
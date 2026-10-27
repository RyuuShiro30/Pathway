<?php

namespace App\Http\Controllers;

use App\Http\Requests\MentorRegistrationRequest;
use App\Models\MentorCertificate;
use App\Models\MentorProfile;
use Cloudinary\Cloudinary;
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

        $mentorProfile = $user->mentorProfile;

        $isNewProfile = !$mentorProfile;

        $isResubmission = $mentorProfile?->verification_status === 'rejected';

        $user->update([
            'name' => $request->name,
        ]);

        $cloudinary = new Cloudinary();

        /*
         * Upload foto profil ke Cloudinary.
         */
        if ($request->hasFile('photo')) {
            // Hapus foto lama dari Cloudinary jika ada.
            if ($user->cloudinary_public_id) {
                $cloudinary->uploadApi()->destroy(
                    $user->cloudinary_public_id,
                    [
                        'resource_type' => 'image',
                    ]
                );
            }

            // Upload foto baru.
            $uploadResult = $cloudinary->uploadApi()->upload(
                $request->file('photo')->getRealPath(),
                [
                    'folder' => 'pathway/mentor-photos',
                    'resource_type' => 'image',
                ]
            );

            $user->photo_path = $uploadResult['secure_url'];
            $user->cloudinary_public_id = $uploadResult['public_id'];
            $user->save();
        }

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
            if ($isResubmission) {
                $mentorData['verification_status'] = 'pending';
            }

            $mentorProfile->update($mentorData);
        } else {
            $mentorData['user_id'] = $user->id;
            $mentorData['verification_status'] = 'pending';

            $mentorProfile = MentorProfile::create($mentorData);
        }

        /*
         * Upload sertifikat ke Cloudinary.
         */
        if ($request->hasFile('certificates')) {
            foreach ($request->file('certificates') as $certificate) {
                $uploadResult = $cloudinary->uploadApi()->upload(
                    $certificate->getRealPath(),
                    [
                        'folder' => 'pathway/mentor-certificates',
                        'resource_type' => 'auto',
                    ]
                );

                MentorCertificate::create([
                    'mentor_profile_id' => $mentorProfile->id,
                    'file_path' => $uploadResult['secure_url'],
                    'file_name' => $certificate->getClientOriginalName(),
                    'cloudinary_public_id' => $uploadResult['public_id'],
                ]);
            }
        }

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

        $cloudinary = new Cloudinary();

        if ($certificate->cloudinary_public_id) {
            $resourceType = str_contains(
                $certificate->file_path,
                '/image/upload/'
            ) ? 'image' : 'raw';

            $cloudinary->uploadApi()->destroy(
                $certificate->cloudinary_public_id,
                [
                    'resource_type' => $resourceType,
                ]
            );
        }

        $certificate->delete();

        return redirect()
            ->route('mentor.register')
            ->with('success', 'Sertifikat berhasil dihapus.');
    }
}
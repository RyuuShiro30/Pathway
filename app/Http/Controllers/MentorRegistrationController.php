<?php

namespace App\Http\Controllers;

use App\Http\Requests\MentorRegistrationRequest;
use App\Models\MentorCertificate;
use App\Models\MentorProfile;
use Cloudinary\Cloudinary;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use App\Models\MentorPortfolio;

class MentorRegistrationController extends Controller
{
    /**
     * Menampilkan halaman pendaftaran mentor.
     */
    public function create(): Response
    {
        $user = auth()->user();

        $expertises = MentorProfile::where('verification_status', 'verified')
            ->where('is_suspended', false)
            ->whereNotNull('expertise')
            ->whereRaw("TRIM(expertise) != ''")
            ->pluck('expertise')
            ->map(fn ($item) => trim($item))
            ->unique(fn ($item) => mb_strtolower($item))
            ->sort()
            ->values();

        $mentorProfile = $user->mentorProfile?->load([
            'certificates',
            'portfolios',
        ]);

        // Pertahankan keahlian mentor yang sudah tersimpan.
        if ($mentorProfile && $mentorProfile->expertise) {
            $expertises->push(trim($mentorProfile->expertise));

            $expertises = $expertises
                ->unique(fn ($item) => mb_strtolower($item))
                ->sort()
                ->values();
        }

        return Inertia::render('Mentor/Register', [
            'user' => $user,
            'mentorProfile' => $mentorProfile,
            'expertises' => $expertises,
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
        ];

        // 1. Buat atau update profil mentor
        if ($mentorProfile) {
            if ($isResubmission) {
                $mentorData['verification_status'] = 'pending';
            }

            $mentorProfile->update($mentorData);
        } else {
            $mentorData['user_id'] = $user->id;
            $mentorData['verification_status'] = 'pending';
            $mentorData['mentor_type'] = 'free';
            $mentorData['price_per_session'] = 0;
            $mentorData['is_available'] = false;

            $mentorProfile = MentorProfile::create($mentorData);
        }

        // 2. Simpan portofolio mentor
        DB::transaction(function () use ($mentorProfile, $request) {
            $submittedIds = [];

            foreach ($request->portofolio as $portfolio) {
                $savedPortfolio = null;

                if (!empty($portfolio['id'])) {
                    $savedPortfolio = $mentorProfile->portfolios()
                        ->whereKey($portfolio['id'])
                        ->first();
                }

                if (!$savedPortfolio) {
                    $savedPortfolio = new MentorPortfolio();
                }

                $savedPortfolio->platform = $portfolio['platform'];
                $savedPortfolio->title = $portfolio['title'];
                $savedPortfolio->url = $portfolio['url'];

                $mentorProfile->portfolios()->save($savedPortfolio);

                $submittedIds[] = $savedPortfolio->id;
            }

            $mentorProfile->portfolios()
                ->whereNotIn('id', $submittedIds)
                ->delete();
        });

        // 3. Simpan sertifikat mentor
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
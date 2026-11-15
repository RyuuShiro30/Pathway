<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\MentorPortfolio;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Cloudinary\Cloudinary;
use App\Models\MentorProfile; 

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $mentorProfile = null;
        $expertises = collect();

        if ($user->isMentor()) {
            $mentorProfile = $user->mentorProfile()
                ->with('portfolios')
                ->first();

            $expertises = MentorProfile::where('verification_status', 'verified')
                ->where('is_suspended', false)
                ->whereNotNull('expertise')
                ->whereRaw("TRIM(expertise) != ''")
                ->pluck('expertise')
                ->map(fn ($item) => trim($item));

            // Pastikan keahlian milik mentor yang sedang diedit tetap tersedia.
            if ($mentorProfile && $mentorProfile->expertise) {
                $expertises->push(trim($mentorProfile->expertise));
            }

            $expertises = $expertises
                ->unique(fn ($item) => mb_strtolower($item))
                ->sort()
                ->values();
        }
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'mentorProfile' => $mentorProfile,
            'expertises' => $expertises,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Update foto profil pengguna melalui Cloudinary.
     */
    public function updatePhoto(Request $request): RedirectResponse
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ], [
            'photo.required' => 'Silakan pilih foto profil terlebih dahulu.',
            'photo.image' => 'File harus berupa gambar.',
            'photo.mimes' => 'Format foto harus JPG, JPEG, atau PNG.',
            'photo.max' => 'Ukuran foto maksimal 2 MB.',
        ]);

        $user = $request->user();
        $cloudinary = new Cloudinary();

        // Upload foto baru terlebih dahulu.
        $uploadResult = $cloudinary->uploadApi()->upload(
            $request->file('photo')->getRealPath(),
            [
                'folder' => 'pathway/mentor-photos',
                'resource_type' => 'image',
            ]
        );

        // Simpan informasi foto baru.
        $oldPublicId = $user->cloudinary_public_id;

        $user->photo_path = $uploadResult['secure_url'];
        $user->cloudinary_public_id = $uploadResult['public_id'];
        $user->save();

        // Hapus foto lama setelah foto baru berhasil disimpan.
        if ($oldPublicId && $oldPublicId !== $uploadResult['public_id']) {
            $cloudinary->uploadApi()->destroy(
                $oldPublicId,
                ['resource_type' => 'image']
            );
        }

        return Redirect::route('profile.edit')
            ->with('status', 'profile-photo-updated');
    }

    public function updateMentorProfile(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->isMentor()) {
            abort(403);
        }

        $mentorProfile = $user->mentorProfile;

        if (!$mentorProfile) {
            abort(404, 'Profil mentor tidak ditemukan.');
        }

        $validated = $request->validate([
            'expertise' => ['required', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'portfolios' => ['nullable', 'array'],
            'portfolios.*.id' => ['nullable', 'integer'],
            'portfolios.*.platform' => [
                'required',
                'string',
                Rule::in(['GitHub', 'LinkedIn', 'Website', 'Behance', 'Figma', 'Instagram', 'Lainnya']),
            ],
            'portfolios.*.title' => ['required', 'string', 'max:255'],
            'portfolios.*.url' => ['required', 'url', 'max:2048'],
        ]);

        DB::transaction(function () use ($mentorProfile, $validated) {
            $mentorProfile->update([
                'expertise' => $validated['expertise'],
                'bio' => $validated['bio'] ?? null,
            ]);

            $submittedIds = [];

            foreach ($validated['portfolios'] ?? [] as $portfolio) {
                $savedPortfolio = $mentorProfile->portfolios()->updateOrCreate(
                    [
                        'id' => $portfolio['id'] ?? null,
                    ],
                    [
                        'platform' => $portfolio['platform'],
                        'title' => $portfolio['title'],
                        'url' => $portfolio['url'],
                    ]
                );

                $submittedIds[] = $savedPortfolio->id;
            }

            $mentorProfile->portfolios()
                ->whereNotIn('id', $submittedIds)
                ->delete();
        });

        return Redirect::route('profile.edit')
            ->with('status', 'mentor-profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}

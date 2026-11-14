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

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        $mentorProfile = null;

        if ($user->isMentor()) {
            $mentorProfile = $user->mentorProfile()
                ->with('portfolios')
                ->first();
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'mentorProfile' => $mentorProfile,
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

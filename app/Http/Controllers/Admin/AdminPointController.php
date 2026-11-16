<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PointTransaction;
use App\Models\User;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminPointController extends Controller
{
    public function index(PointService $pointService)
    {
        $mentors = User::query()
            ->where('role', 'mentor')
            ->with('mentorProfile:id,user_id,expertise')
            ->orderBy('name')
            ->paginate(20);

        $mentors->through(
            fn (User $mentor): array => [
                'id' => $mentor->id,
                'name' => $mentor->name,
                'email' => $mentor->email,
                'expertise' => $mentor->mentorProfile?->expertise,
                'points_balance' => $pointService->balanceFor($mentor->id),
            ]
        );

        $recentBonuses = PointTransaction::query()
            ->with('user:id,name,email')
            ->where('transaction_type', 'admin_bonus')
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Admin/Point/Index', [
            'mentors' => $mentors,
            'recentBonuses' => $recentBonuses,
        ]);
    }

    public function store(Request $request, PointService $pointService)
    {
        $validated = $request->validate([
            'user_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where('role', 'mentor'),
            ],
            'amount' => ['required', 'integer', 'min:1', 'max:10000'],
            'description' => ['required', 'string', 'max:255'],
        ], [
            'user_id.required' => 'Mentor wajib dipilih.',
            'user_id.exists' => 'Mentor tidak ditemukan.',
            'amount.required' => 'Jumlah poin wajib diisi.',
            'amount.integer' => 'Jumlah poin harus berupa angka.',
            'amount.min' => 'Minimal poin bonus adalah 1.',
            'amount.max' => 'Maksimal poin bonus adalah 10000.',
            'description.required' => 'Keterangan bonus wajib diisi.',
            'description.max' => 'Keterangan maksimal 255 karakter.',
        ]);

        $pointService->awardBonus(
            (int) $validated['user_id'],
            (int) $validated['amount'],
            $validated['description'],
        );

        return redirect()
            ->back()
            ->with('success', 'Poin bonus berhasil ditambahkan ke mentor.');
    }
}

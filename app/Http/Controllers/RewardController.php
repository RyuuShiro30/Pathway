<?php

namespace App\Http\Controllers;

use App\Models\BadgeInventory;
use App\Models\MerchandiseInventory;
use App\Models\PointTransaction;
use App\Models\User;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RewardController extends Controller
{
    public function index(Request $request, PointService $pointService): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $currentTab = $request->query('tab') === 'merchandise'
            ? 'merchandise'
            : 'badge';

        $badges = BadgeInventory::query()
            ->withExists([
                'userBadges as is_owned' => function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                },
            ])
            ->orderBy('point_cost')
            ->get();

        $merchandises = MerchandiseInventory::query()
            ->where('stock', '>', 0)
            ->orderBy('point_cost')
            ->get();

        return Inertia::render('Mentor/Rewards/Index', [
            'badges' => $badges,
            'merchandises' => $merchandises,
            'pointsBalance' => $pointService->balanceFor($user->id),
            'currentTab' => $currentTab,
        ]);
    }

    public function history(PointService $pointService): Response
    {
        $userId = (int) Auth::id();

        $transactions = PointTransaction::query()
            ->where('user_id', $userId)
            ->latest()
            ->limit(100)
            ->get()
            ->map(static fn (PointTransaction $transaction): array => [
                'id' => $transaction->id,
                'amount' => $transaction->amount,
                'transaction_type' => $transaction->transaction_type,
                'description' => $transaction->description,
                'is_earning' => in_array(
                    $transaction->transaction_type,
                    ['earned_mentoring', 'admin_bonus'],
                    true
                ),
                'created_at' => $transaction->created_at?->copy()
                    ->setTimezone('UTC')
                    ->toISOString(),
            ])
            ->values();

        return Inertia::render('Mentor/Points/History', [
            'transactions' => $transactions,
            'pointsBalance' => $pointService->balanceFor($userId),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\BadgeInventory;
use App\Models\PointTransaction;
use App\Models\User;
use App\Models\UserBadge;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BadgeController extends Controller
{
    /**
     * Menghitung saldo poin mentor.
     */
    private function getPointsBalance(int $userId): int
    {
        $balance = PointTransaction::query()
            ->where('user_id', $userId)
            ->selectRaw("
                COALESCE(SUM(
                    CASE
                        WHEN transaction_type IN ('earned_mentoring', 'admin_bonus')
                            THEN amount
                        WHEN transaction_type IN ('redeemed_badge', 'redeemed_merchandise')
                            THEN -amount
                        ELSE 0
                    END
                ), 0) AS balance
            ")
            ->value('balance');

        return (int) $balance;
    }

    /**
     * Menampilkan katalog badge dan saldo poin mentor.
     */
    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $pointsBalance = $this->getPointsBalance($user->id);

        $badges = BadgeInventory::query()
            ->withExists([
                'userBadges as is_owned' => function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                },
            ])
            ->orderBy('point_cost')
            ->get();

        return Inertia::render('Mentor/Badges/Index', [
            'badges' => $badges,
            'pointsBalance' => $pointsBalance,
        ]);
    }

    /**
     * Menukarkan poin mentor dengan badge.
     */
    public function redeem(int $id): RedirectResponse
    {
        abort_if(Auth::user()?->isSuspendedMentor(), 403, 'Akun mentor Anda sedang disuspend.');

        $userId = Auth::id();

        try {
            DB::transaction(function () use ($id, $userId) {

                // Kunci akun agar penukaran badge dan merchandise
                // tidak menggunakan saldo yang sama secara bersamaan.
                User::query()
                    ->whereKey($userId)
                    ->lockForUpdate()
                    ->firstOrFail();

                $badge = BadgeInventory::query()
                    ->lockForUpdate()
                    ->findOrFail($id);

                $alreadyOwned = UserBadge::query()
                    ->where('user_id', $userId)
                    ->where('badge_id', $badge->id)
                    ->exists();

                if ($alreadyOwned) {
                    throw new \RuntimeException(
                        'Badge ini sudah kamu miliki.'
                    );
                }

                // Hitung saldo setelah memperhitungkan
                // penukaran badge maupun merchandise.
                $balance = $this->getPointsBalance($userId);

                if ($balance < $badge->point_cost) {
                    throw new \RuntimeException(
                        'Poin kamu belum cukup untuk menukar badge ini.'
                    );
                }

                UserBadge::query()->create([
                    'user_id' => $userId,
                    'badge_id' => $badge->id,
                    'redeemed_at' => now(),
                ]);

                PointTransaction::query()->create([
                    'user_id' => $userId,
                    'amount' => $badge->point_cost,
                    'transaction_type' => 'redeemed_badge',
                    'description' => 'Penukaran badge: '.$badge->name,
                    'related_id' => $badge->id,
                ]);
            });

            return back()->with('success', 'Badge berhasil ditukar!');

        } catch (\RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        }
    }
}

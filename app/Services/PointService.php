<?php

namespace App\Services;

use App\Models\PointTransaction;

class PointService
{
    public function balanceFor(int $userId): int
    {
        return (int) PointTransaction::query()
            ->where('user_id', $userId)
            ->selectRaw($this->balanceExpression())
            ->value('balance');
    }

    public function circulating(): int
    {
        return (int) PointTransaction::query()
            ->selectRaw($this->balanceExpression())
            ->value('balance');
    }

    public function awardBonus(int $userId, int $amount, string $description): PointTransaction
    {
        return PointTransaction::query()->create([
            'user_id' => $userId,
            'amount' => $amount,
            'transaction_type' => 'admin_bonus',
            'description' => $description,
            'related_id' => null,
        ]);
    }

    private function balanceExpression(): string
    {
        return "
            COALESCE(SUM(
                CASE
                    WHEN transaction_type IN ('earned_mentoring', 'admin_bonus')
                        THEN amount
                    WHEN transaction_type IN ('redeemed_badge', 'redeemed_merchandise')
                        THEN -amount
                    ELSE 0
                END
            ), 0) AS balance
        ";
    }
}

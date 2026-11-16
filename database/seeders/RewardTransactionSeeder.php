<?php

namespace Database\Seeders;

use App\Models\BadgeInventory;
use App\Models\MerchandiseInventory;
use App\Models\PointTransaction;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserMerchandise;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class RewardTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $mainMentor = User::query()->where('email', 'mentor@test.com')->first();
        $secondMentor = User::query()->where('email', 'siti.mentor@pathway.test')->first();
        $javaBadge = BadgeInventory::query()->where('name', 'Badge Java')->first();
        $stickerPack = MerchandiseInventory::query()->where('name', 'Sticker Pack Pathway')->first();

        if (! $mainMentor || ! $javaBadge || ! $stickerPack) {
            $this->command?->warn(
                'RewardTransactionSeeder dilewati karena data demo belum tersedia.'
            );

            return;
        }

        $now = Carbon::now();

        $this->recordTransaction(
            $mainMentor->id,
            800,
            'earned_mentoring',
            'Poin dari sesi mentoring Laravel.',
            $now->copy()->subDays(10)
        );

        $this->recordTransaction(
            $mainMentor->id,
            600,
            'earned_mentoring',
            'Poin dari sesi mentoring React.',
            $now->copy()->subDays(8)
        );

        $this->recordTransaction(
            $mainMentor->id,
            200,
            'admin_bonus',
            'Bonus apresiasi kontribusi komunitas.',
            $now->copy()->subDays(6)
        );

        UserBadge::query()->firstOrCreate(
            [
                'user_id' => $mainMentor->id,
                'badge_id' => $javaBadge->id,
            ],
            [
                'redeemed_at' => $now->copy()->subDays(5),
            ]
        );

        $this->recordTransaction(
            $mainMentor->id,
            $javaBadge->point_cost,
            'redeemed_badge',
            'Penukaran badge: '.$javaBadge->name,
            $now->copy()->subDays(5),
            $javaBadge->id
        );

        $orders = [
            [
                'shipping_status' => 'menunggu',
                'tracking_number' => null,
                'redeemed_at' => $now->copy()->subDays(4),
            ],
            [
                'shipping_status' => 'diproses',
                'tracking_number' => null,
                'redeemed_at' => $now->copy()->subDays(3),
            ],
            [
                'shipping_status' => 'dikirim',
                'tracking_number' => 'JNE1234567890',
                'redeemed_at' => $now->copy()->subDays(2),
            ],
            [
                'shipping_status' => 'diterima',
                'tracking_number' => 'JNE0987654321',
                'redeemed_at' => $now->copy()->subDays(1),
            ],
        ];

        foreach ($orders as $order) {
            UserMerchandise::query()->updateOrCreate(
                [
                    'user_id' => $mainMentor->id,
                    'merchandise_id' => $stickerPack->id,
                    'recipient_name' => $mainMentor->name,
                    'shipping_status' => $order['shipping_status'],
                ],
                [
                    'quantity' => 1,
                    'points_spent' => $stickerPack->point_cost,
                    'phone_number' => '081234567890',
                    'shipping_address' => 'Jl. Contoh No. 123, Bandung, Jawa Barat',
                    'tracking_number' => $order['tracking_number'],
                    'redeemed_at' => $order['redeemed_at'],
                ]
            );

            $this->recordTransaction(
                $mainMentor->id,
                $stickerPack->point_cost,
                'redeemed_merchandise',
                'Penukaran merchandise: '.$stickerPack->name.' ('.$order['shipping_status'].')',
                $order['redeemed_at'],
                $stickerPack->id
            );
        }

        if ($secondMentor) {
            $this->recordTransaction(
                $secondMentor->id,
                250,
                'earned_mentoring',
                'Poin dari sesi mentoring UI/UX.',
                $now->copy()->subDays(7)
            );
        }
    }

    private function recordTransaction(
        int $userId,
        int $amount,
        string $type,
        string $description,
        Carbon $createdAt,
        ?int $relatedId = null
    ): void {
        $transaction = PointTransaction::query()->updateOrCreate(
            [
                'user_id' => $userId,
                'transaction_type' => $type,
                'description' => $description,
            ],
            [
                'amount' => $amount,
                'related_id' => $relatedId,
            ]
        );

        $transaction->forceFill([
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ])->save();
    }
}

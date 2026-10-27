<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class MentorSuspended extends Notification
{
    public function __construct(private readonly string $reason) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, string>
     */
    public function toArray(object $notifiable): array
    {
        $detail = match ($this->reason) {
            'refund_terlambat' => 'refund terlambat lebih dari 48 jam',
            'no_show_berulang' => '3 laporan no-show berlaku dalam 30 hari',
            default => 'keputusan admin',
        };

        return [
            'message' => "Akun mentor Anda disuspend karena {$detail}. Anda tidak bisa menerima booking baru sampai suspend dicabut.",
            'url' => route('mentor.dashboard', [], false),
        ];
    }
}

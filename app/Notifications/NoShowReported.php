<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class NoShowReported extends Notification
{
    public function __construct(private readonly string $url) {}

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
        return [
            'message' => 'Anda dilaporkan tidak hadir di sebuah sesi. Tanggapi dalam 24 jam, kalau tidak laporan berlaku.',
            'url' => $this->url,
        ];
    }
}

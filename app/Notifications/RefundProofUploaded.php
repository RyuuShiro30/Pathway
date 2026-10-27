<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class RefundProofUploaded extends Notification
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
            'message' => 'Mentor sudah mengunggah bukti transfer refund. Cek rekening Anda lalu konfirmasi.',
            'url' => $this->url,
        ];
    }
}

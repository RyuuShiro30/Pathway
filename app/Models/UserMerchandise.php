<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMerchandise extends Model
{
    protected $table = 'user_merchandise';

    protected $fillable = [
        'user_id',
        'merchandise_id',
        'quantity',
        'points_spent',
        'recipient_name',
        'phone_number',
        'shipping_address',
        'shipping_status',
        'tracking_number',
        'redeemed_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'points_spent' => 'integer',
            'redeemed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function merchandise(): BelongsTo
    {
        return $this->belongsTo(MerchandiseInventory::class, 'merchandise_id');
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JourneyBookmark extends Model
{
    protected $fillable = [
        'journey_id',
        'user_id',
    ];

    public function journey(): BelongsTo
    {
        return $this->belongsTo(Journey::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

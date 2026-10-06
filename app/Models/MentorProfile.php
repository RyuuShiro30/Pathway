<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorProfile extends Model
{
    protected $fillable = [
        'user_id',
        'expertise',
        'bio',
        'portfolio_url',
        'verification_status',
        'mentor_type',
        'price_per_session',
        'avg_rating',
        'is_available',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
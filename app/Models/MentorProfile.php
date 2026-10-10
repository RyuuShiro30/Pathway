<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    protected function casts(): array
    {
        return [
            'price_per_session' => 'decimal:2',
            'avg_rating' => 'decimal:2',
            'is_available' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(MentorCertificate::class);
    }
}
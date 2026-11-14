<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MentorPortfolio extends Model
{
    protected $fillable = [
        'mentor_profile_id',
        'platform',
        'title',
        'url',
    ];

    public function mentorProfile(): BelongsTo
    {
        return $this->belongsTo(MentorProfile::class);
    }

    public function portfolios(): HasMany
    {
        return $this->hasMany(MentorPortfolio::class);
    }
}
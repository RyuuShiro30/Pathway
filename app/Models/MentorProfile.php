<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MentorProfile extends Model
{
    protected $fillable = [
    'user_id',
    'expertise',
    'bio',
    'portfolio_url',
    'discord_room_link',
    'verification_status',
    'mentor_type',
    'price_per_session',
    'avg_rating',
    'is_available',
    'is_suspended',
    'availability_schedule',
];

protected $casts = [
    'is_available' => 'boolean',
    'is_suspended' => 'boolean',
    'price_per_session' => 'decimal:2',
    'avg_rating' => 'decimal:2',
    'availability_schedule' => 'array',
];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function mentoringSessions()
    {
        return $this->hasMany(MentoringSession::class, 'mentor_id', 'user_id');
    }
}
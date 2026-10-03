<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MentoringSession extends Model
{
    protected $fillable = [
        'student_id',
        'mentor_id',
        'status',
        'schedule_time',
        'end_time',
        'notes_from_student',
        'notes_from_mentor',
        'discord_link',
        'proof_file',
        'is_free_session',
        'price_snapshot',
    ];

    protected $casts = [
        'schedule_time' => 'datetime',
        'end_time' => 'datetime',
        'is_free_session' => 'boolean',
        'price_snapshot' => 'decimal:2',
    ];

    public function mentor()
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
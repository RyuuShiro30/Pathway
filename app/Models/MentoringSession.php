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
        'duration_hours',
        'notes_from_student',
        'notes_from_mentor',
        'discord_link',
        'proof_file',
        'is_free_session',
        'price_snapshot',
        'payment_dp_proof',
        'payment_dp_status',
        'payment_final_proof',
        'cancelled_by',
        'cancellation_reason',
        'refund_proof',
        'refund_status',
        'refund_deadline',
    ];

    protected $casts = [
        'schedule_time' => 'datetime',
        'end_time' => 'datetime',
        'is_free_session' => 'boolean',
        'price_snapshot' => 'decimal:2',
        'refund_deadline' => 'datetime',
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
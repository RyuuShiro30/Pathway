<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RescheduleRequest extends Model
{

    protected $table = 'mentoring_reschedule_requests';

    protected $fillable = [
        'session_id',
        'requested_by',
        'request_type',
        'old_schedule_time',
        'old_end_time',
        'new_schedule_time',
        'new_end_time',
        'status',
        'respond_deadline',
        'responded_at',
        'rejection_reason',
        'refund_paused_at',
    ];

    protected $casts = [
        'old_schedule_time' => 'datetime',
        'old_end_time' => 'datetime',
        'new_schedule_time' => 'datetime',
        'new_end_time' => 'datetime',
        'respond_deadline' => 'datetime',
        'responded_at' => 'datetime',
        'refund_paused_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(MentoringSession::class, 'session_id');
    }
}
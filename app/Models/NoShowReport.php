<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NoShowReport extends Model
{
    protected $fillable = [
        'session_id',
        'reporter_id',
        'reported_user_id',
        'status',
        'reporter_note',
        'evidence_path',
        'respond_deadline',
        'response_note',
        'response_evidence_path',
        'responded_at',
        'finalized_at',
    ];

    protected $casts = [
        'respond_deadline' => 'datetime',
        'responded_at' => 'datetime',
        'finalized_at' => 'datetime',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(MentoringSession::class, 'session_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function reportedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_user_id');
    }
}

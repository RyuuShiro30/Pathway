<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UnresolvedSessionCase extends Model
{
    protected $fillable = [
        'mentoring_session_id',
        'status',
        'decision',
        'admin_note',
        'reviewed_by',
        'reviewed_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function mentoringSession(): BelongsTo
    {
        return $this->belongsTo(MentoringSession::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
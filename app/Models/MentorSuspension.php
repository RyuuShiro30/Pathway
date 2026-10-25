<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorSuspension extends Model
{
    public const REASON_LATE_REFUND = 'refund_terlambat';

    public const REASON_NO_SHOW = 'no_show_berulang';

    public const REASON_MANUAL = 'manual';

    protected $fillable = [
        'mentor_id',
        'reason',
        'session_id',
        'note',
        'suspended_at',
        'lifted_at',
        'lifted_by',
        'lift_note',
    ];

    protected $casts = [
        'suspended_at' => 'datetime',
        'lifted_at' => 'datetime',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('lifted_at');
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(MentoringSession::class, 'session_id');
    }

    public function liftedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lifted_by');
    }
}

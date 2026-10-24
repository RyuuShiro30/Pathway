<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
        'refund_proof_uploaded_at',
    ];

    protected $casts = [
        'schedule_time' => 'datetime',
        'end_time' => 'datetime',
        'is_free_session' => 'boolean',
        'price_snapshot' => 'decimal:2',
        'refund_deadline' => 'datetime',
        'refund_proof_uploaded_at' => 'datetime',
    ];

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class, 'session_id');
    }

    public function noShowReport(): HasOne
    {
        return $this->hasOne(NoShowReport::class, 'session_id');
    }

    public function canReportNoShow(): bool
    {
        if ($this->status !== 'dikonfirmasi' || $this->noShowReport !== null) {
            return false;
        }

        $now = now();
        $endTime = $this->end_time
            ?? $this->schedule_time->copy()->addHours($this->duration_hours ?? 1);

        return $now->gte($this->schedule_time->copy()->addMinutes(15))
            && $now->lte($endTime->copy()->addHours(24));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function noShowReportPayloadFor(int $viewerId): ?array
    {
        $report = $this->noShowReport;

        if (! $report) {
            return null;
        }

        $isReporter = (int) $report->reporter_id === $viewerId;

        return [
            'id' => $report->id,
            'status' => $report->status,
            'is_reporter' => $isReporter,
            'reporter_note' => $report->reporter_note,
            'response_note' => $report->response_note,
            'has_response_evidence' => $report->response_evidence_path !== null,
            'respond_deadline' => $report->respond_deadline
                ->copy()
                ->setTimezone('UTC')
                ->toISOString(),
            'can_respond' => ! $isReporter
                && $report->status === 'menunggu_respons'
                && now()->lt($report->respond_deadline),
        ];
    }
}

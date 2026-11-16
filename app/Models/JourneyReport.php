<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JourneyReport extends Model
{
    public const STATUS_MENUNGGU = 'menunggu';

    public const STATUS_SELESAI = 'selesai';

    protected $fillable = [
        'journey_id',
        'reporter_id',
        'reason',
        'status',
    ];

    public function journey(): BelongsTo
    {
        return $this->belongsTo(Journey::class);
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }
}

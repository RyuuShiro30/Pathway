<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorCertificate extends Model
{
    protected $fillable = [
        'mentor_profile_id',
        'file_path',
        'file_name',
        'cloudinary_public_id',
    ];

    public function mentorProfile(): BelongsTo
    {
        return $this->belongsTo(MentorProfile::class);
    }
}
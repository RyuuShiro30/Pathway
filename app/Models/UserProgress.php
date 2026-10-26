<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProgress extends Model
{
    protected $table = 'user_progress';
    protected $guarded = ['id'];

    public function enrollment()
    {
        return $this->belongsTo(UserEnrollment::class, 'enrollment_id');
    }
}

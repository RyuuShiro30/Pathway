<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserEnrollment extends Model
{
    protected $guarded = ['id']; 

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke detail progress materi
    public function userProgress()
    {
        return $this->hasMany(UserProgress::class, 'enrollment_id');
    }
}
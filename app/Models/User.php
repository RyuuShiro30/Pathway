<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name',
    'email',
    'password',
    'photo_path',
    'cloudinary_public_id',
    'bank_name',
    'bank_account_number',
    'bank_account_holder',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function mentorProfile(): HasOne
    {
        return $this->hasOne(MentorProfile::class, 'user_id', 'id');
    }

    public function mentoringSessionsAsMentor()
    {
        return $this->hasMany(MentoringSession::class, 'mentor_id');
    }

    public function mentoringSessionsAsStudent()
    {
        return $this->hasMany(MentoringSession::class, 'student_id');
    }

    public function enrollments()
    {
        return $this->hasMany(UserEnrollment::class);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}

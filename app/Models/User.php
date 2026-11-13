<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'photo_path', 'cloudinary_public_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isMentor(): bool
    {
        return $this->role === 'mentor';
    }

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

    // Relasi transaksi poin
    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class, 'user_id');
    }

    // Relasi badge yang dimiliki user
    public function badges(): HasMany
    {
        return $this->hasMany(UserBadge::class, 'user_id');
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function enrollments()
    {
        return $this->hasMany(UserEnrollment::class);
    }
    public function courseMaterials()
    {
        // Urutkan otomatis berdasarkan kolom sequence_order
        return $this->hasMany(CourseMaterial::class)->orderBy('sequence_order', 'asc');
    }
}
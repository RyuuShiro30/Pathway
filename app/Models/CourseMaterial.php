<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseMaterial extends Model
{
    use HasFactory;

    // Sesuaikan dengan struktur kolom di tabel course_materials
    protected $fillable = [
        'course_id',
        'section_name',
        'title',
        'content_url',
        'content_body',
        'sequence_order',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
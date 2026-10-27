<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Forum extends Model
{
    // Daftarkan 'image_url' di sini supaya tidak kena error mass assignment
    protected $fillable = [
        'course_id', 
        'author_id', 
        'title', 
        'body', 
        'image_url', 
        'is_solved'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
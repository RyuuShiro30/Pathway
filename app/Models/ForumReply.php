<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ForumReply extends Model
{
    protected $fillable = ['forum_id', 'user_id', 'body', 'is_accepted_answer'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
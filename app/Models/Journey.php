<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Journey extends Model
{
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_MENUNGGU = 'menunggu';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_DITOLAK = 'ditolak';

    protected $fillable = [
        'author_id',
        'title',
        'slug',
        'content',
        'likes_count',
        'status',
        'moderation_note',
        'allow_comments',
    ];

    protected function casts(): array
    {
        return [
            'likes_count' => 'integer',
            'allow_comments' => 'boolean',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(JourneyLike::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(JourneyBookmark::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(JourneyComment::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(JourneyReport::class);
    }
}

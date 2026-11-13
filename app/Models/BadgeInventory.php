<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BadgeInventory extends Model
{
    protected $table = 'badges_inventory';

    protected $fillable = [
        'name',
        'description',
        'point_cost',
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'point_cost' => 'integer',
        ];
    }

    public function userBadges(): HasMany
    {
        return $this->hasMany(UserBadge::class, 'badge_id');
    }
}
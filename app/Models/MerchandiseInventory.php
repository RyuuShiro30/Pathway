<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MerchandiseInventory extends Model
{
    protected $table = 'merchandise_inventory';

    protected $fillable = [
        'name',
        'description',
        'point_cost',
        'image_url',
        'stock',
    ];

    protected function casts(): array
    {
        return [
            'point_cost' => 'integer',
            'stock' => 'integer',
        ];
    }

    public function userMerchandise(): HasMany
    {
        return $this->hasMany(UserMerchandise::class, 'merchandise_id');
    }
}

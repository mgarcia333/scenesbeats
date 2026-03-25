<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'external_id',
        'title',
        'subtitle',
        'image_url',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

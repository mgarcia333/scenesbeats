<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecommendationHistory extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'external_id',
        'title',
        'subtitle',
        'image_url',
        'reason',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

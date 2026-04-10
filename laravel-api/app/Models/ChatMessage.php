<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $fillable = [
        'room_id',
        'user_id',
        'content',
        'type',
        'gif_url',
        'item_id',
        'item_type',
        'item_title',
        'item_image',
        'item_subtitle'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

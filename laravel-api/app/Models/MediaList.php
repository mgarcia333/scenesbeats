<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaList extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'cover_image_url',
        'is_public',
    ];

    public function items()
    {
        return $this->hasMany(MediaListItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function collaborators()
    {
        return $this->belongsToMany(User::class, 'media_list_collaborators', 'media_list_id', 'user_id')->withTimestamps();
    }
}

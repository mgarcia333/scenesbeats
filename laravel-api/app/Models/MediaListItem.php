<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaListItem extends Model
{
    protected $fillable = [
        'media_list_id',
        'type',
        'external_id',
        'title',
        'subtitle',
        'image_url',
    ];

    public function mediaList()
    {
        return $this->belongsTo(MediaList::class);
    }
}

<?php

namespace App\Observers;

use App\Models\Favorite;
use App\Models\Activity;

class FavoriteObserver
{
    /**
     * Handle the Favorite "created" event.
     */
    public function created(Favorite $favorite): void
    {
        Activity::create([
            'user_id' => $favorite->user_id,
            'type' => 'favorite_added',
            'subject_id' => $favorite->id,
            'subject_type' => Favorite::class,
            'data' => [
                'item_title' => $favorite->title,
                'media_type' => $favorite->type,
                'image_url' => $favorite->image_url,
                'position' => $favorite->position
            ]
        ]);
    }
}

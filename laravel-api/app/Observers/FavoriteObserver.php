<?php

namespace App\Observers;

use App\Models\Favorite;
use App\Models\Activity;
use App\Helpers\NodeBroadcaster;

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

        NodeBroadcaster::broadcast('favorite_added', [
            'user_id' => $favorite->user_id,
            'type' => $favorite->type,
            'title' => $favorite->title,
            'position' => $favorite->position
        ]);
    }
}

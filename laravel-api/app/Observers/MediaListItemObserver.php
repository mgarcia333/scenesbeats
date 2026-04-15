<?php

namespace App\Observers;

use App\Models\MediaListItem;
use App\Models\Activity;
use App\Helpers\NodeBroadcaster;

class MediaListItemObserver
{
    /**
     * Handle the MediaListItem "created" event.
     */
    public function created(MediaListItem $item): void
    {
        // 1. Create activity record (broadcasted automatically by Activity model)
        Activity::create([
            'user_id' => $item->mediaList->user_id,
            'type' => 'item_added_to_list',
            'subject_id' => $item->id,
            'subject_type' => MediaListItem::class,
            'data' => [
                'list_name' => $item->mediaList->name,
                'list_id' => $item->media_list_id,
                'item_title' => $item->title,
                'media_type' => $item->type,
                'image_url' => $item->image_url
            ]
        ]);

        // 2. Direct real-time notification to list listeners
        NodeBroadcaster::broadcast('list_updated', [
            'list_id' => $item->media_list_id,
            'action' => 'added',
            'item' => $item->toArray()
        ]);
    }

    /**
     * Handle the MediaListItem "deleted" event.
     */
    public function deleted(MediaListItem $item): void
    {
        NodeBroadcaster::broadcast('list_updated', [
            'list_id' => $item->media_list_id,
            'action' => 'removed',
            'item_id' => $item->id
        ]);
    }
}

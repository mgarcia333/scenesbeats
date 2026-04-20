<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MediaList;
use App\Models\MediaListItem;
use App\Models\Activity;
use App\Helpers\NodeBroadcaster;
use Illuminate\Http\Request;

class MediaListController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        if (!$userId) {
            return response()->json(['error' => 'user_id required'], 400);
        }

        $lists = MediaList::with(['items', 'collaborators', 'user'])
            ->where('user_id', $userId)
            ->orWhereHas('collaborators', function($q) use ($userId) {
                $q->where('user_id', $userId);
            })
            ->get();
        return response()->json($lists);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_image_url' => 'nullable|string',
            'is_public' => 'boolean'
        ]);

        $list = MediaList::create([
            'user_id' => $request->user_id,
            'name' => $request->name,
            'description' => $request->description,
            'cover_image_url' => $request->cover_image_url,
            'is_public' => $request->is_public ?? true
        ]);

        // Create activity linked to the list
        Activity::create([
            'user_id'      => $request->user_id,
            'type'         => 'list_created',
            'subject_id'   => $list->id,
            'subject_type' => MediaList::class,
            'data'         => [
                'list_id'   => $list->id,
                'list_name' => $list->name
            ]
        ]);

        // Broadcast new list to other users (the Activity observer also sends 'new_activity')
        NodeBroadcaster::broadcast('list_created', [
            'list_id' => $list->id,
            'user_id' => $list->user_id,
            'name'    => $list->name
        ]);

        return response()->json($list, 201);
    }

    public function show($id)
    {
        $list = MediaList::with(['items', 'collaborators', 'user'])->find($id);
        
        if (!$list) {
            return response()->json(['error' => 'Not Found'], 404);
        }

        return response()->json($list);
    }

    public function update(Request $request, $id)
    {
        $list = MediaList::find($id);

        if (!$list) {
            return response()->json(['error' => 'Not Found'], 404);
        }

        $list->update($request->only(['name', 'description', 'cover_image_url', 'is_public']));

        return response()->json($list);
    }

    public function destroy($id)
    {
        $list = MediaList::find($id);

        if (!$list) {
            return response()->json(['error' => 'Not Found'], 404);
        }

        $listId = $list->id;
        $list->delete();
        
        // Broadcast list deletion
        NodeBroadcaster::broadcast('list_deleted', [
            'list_id' => $listId,
            'user_id' => $list->user_id
        ]);
        
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function addItem(Request $request, $id)
    {
        $list = MediaList::find($id);

        if (!$list) {
            return response()->json(['error' => 'List Not Found'], 404);
        }

        $request->validate([
            'type' => 'required|string',
            'external_id' => 'required|string',
            'title' => 'required|string',
            'subtitle' => 'nullable|string',
            'image_url' => 'nullable|string',
        ]);

        // Check if item already exists in this list
        $exists = MediaListItem::where('media_list_id', $id)
                                ->where('external_id', $request->external_id)
                                ->where('type', $request->type)
                                ->first();

        if ($exists) {
            return response()->json(['error' => 'Item already in list'], 409);
        }

        $item = MediaListItem::create([
            'media_list_id' => $id,
            'type' => $request->type,
            'external_id' => $request->external_id,
            'title' => $request->title,
            'subtitle' => $request->subtitle,
            'image_url' => $request->image_url,
        ]);

        // If list has no cover, use this item's image
        if (!$list->cover_image_url && $item->image_url) {
            $list->cover_image_url = $item->image_url;
            $list->save();
        }

        // Create activity linked correctly
        Activity::create([
            'user_id'      => $list->user_id,
            'type'         => 'item_added_to_list',
            'subject_id'   => $item->id,
            'subject_type' => MediaListItem::class,
            'data' => [
                'list_id'    => $list->id,
                'list_name'  => $list->name,
                'item_title' => $item->title,
                'item_image' => $item->image_url,
                'item_type'  => $item->type,
            ]
        ]);

        // Broadcast item added to all users in this list's room (collaborators)
        NodeBroadcaster::broadcast('list_updated', [
            'list_id' => (int)$id,
            'action'  => 'item_added',
            'item'    => $item->toArray(),
        ]);

        return response()->json($item, 201);
    }

    public function removeItem($id, $itemId)
    {
        $item = MediaListItem::where('media_list_id', $id)->where('id', $itemId)->first();

        if (!$item) {
            return response()->json(['error' => 'Item Not Found'], 404);
        }

        $itemId = $item->id;
        $item->delete();

        // Broadcast item removed so collaborators see it disappear in real time
        NodeBroadcaster::broadcast('list_updated', [
            'list_id' => (int)$id,
            'action'  => 'item_removed',
            'item_id' => $itemId,
        ]);

        return response()->json(['message' => 'Item removed from list']);
    }

    public function addCollaborator(Request $request, $id)
    {
        $list = MediaList::find($id);
        if (!$list) return response()->json(['error' => 'List Not Found'], 404);

        $request->validate(['user_id' => 'required|exists:users,id']);
        
        if ($list->user_id == $request->user_id) {
            return response()->json(['error' => 'Owner cannot be a collaborator'], 400);
        }

        $list->collaborators()->syncWithoutDetaching([$request->user_id]);

        return response()->json(['message' => 'Collaborator added successfully']);
    }

    public function removeCollaborator(Request $request, $id)
    {
        $list = MediaList::find($id);
        if (!$list) return response()->json(['error' => 'List Not Found'], 404);

        $request->validate(['user_id' => 'required|exists:users,id']);
        
        $list->collaborators()->detach($request->user_id);

        return response()->json(['message' => 'Collaborator removed successfully']);
    }
}

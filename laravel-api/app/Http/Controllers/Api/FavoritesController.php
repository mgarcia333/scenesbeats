<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Activity;
use App\Models\User;
use App\Helpers\NodeBroadcaster;
use Illuminate\Http\Request;

class FavoritesController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        if (!$userId) return response()->json(['error' => 'user_id required'], 400);

        $favorites = Favorite::where('user_id', $userId)->latest()->get();
        return response()->json($favorites);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'     => 'required|exists:users,id',
            'type'        => 'required|string',
            'position'    => 'required|integer|min:1|max:4',
            'external_id' => 'required|string',
            'title'       => 'required|string',
            'subtitle'    => 'nullable|string',
            'image_url'   => 'nullable|string',
        ]);

        $favorite = Favorite::updateOrCreate(
            [
                'user_id'  => $validated['user_id'],
                'type'     => $validated['type'],
                'position' => $validated['position']
            ],
            $validated
        );

        // Create activity so the community feed shows this action
        Activity::create([
            'user_id' => $validated['user_id'],
            'type'    => 'favorite_added',
            'data'    => [
                'item_title' => $validated['title'],
                'item_image' => $validated['image_url'] ?? null,
                'item_type'  => $validated['type'],
            ]
        ]);

        // Broadcast so the user's own Profile updates in real-time
        // (also picked up by friends viewing the profile)
        NodeBroadcaster::broadcast('favorite_added', [
            'user_id'  => (int)$validated['user_id'],
            'favorite' => $favorite->toArray(),
        ]);

        return response()->json($favorite, 201);
    }

    public function destroy($id)
    {
        $favorite = Favorite::findOrFail($id);
        $userId   = $favorite->user_id;
        $favorite->delete();

        // Broadcast removal so Profile updates in real-time
        NodeBroadcaster::broadcast('favorite_removed', [
            'user_id'     => (int)$userId,
            'favorite_id' => (int)$id,
        ]);

        return response()->json(['message' => 'Removed from favorites']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\User;
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
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string',
            'position' => 'required|integer|min:1|max:4',
            'external_id' => 'required|string',
            'title' => 'required|string',
            'subtitle' => 'nullable|string',
            'image_url' => 'nullable|string',
        ]);

        $favorite = Favorite::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'type' => $validated['type'],
                'position' => $validated['position']
            ],
            $validated
        );

        return response()->json($favorite, 201);
    }

    public function destroy($id)
    {
        $favorite = Favorite::findOrFail($id);
        $favorite->delete();

        return response()->json(['message' => 'Removed from favorites']);
    }
}

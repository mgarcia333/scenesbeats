<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Friendship;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get 3 random user suggestions excluding the current user and their friends/pending requests.
     */
    public function suggestions(Request $request)
    {
        $userId = $request->query('user_id');

        // If no valid numeric user_id, return empty list to avoid suggesting the current user to themselves
        if (!$userId || !is_numeric($userId)) {
            return response()->json([]);
        }

        // Get IDs of users who already have any friendship record with this user (sent or received)
        $sentIds = Friendship::where('sender_id', $userId)->pluck('recipient_id');
        $receivedIds = Friendship::where('recipient_id', $userId)->pluck('sender_id');
        
        $relatedIds = $sentIds->merge($receivedIds)->push($userId)->unique()->values();

        $suggestions = User::whereNotIn('id', $relatedIds)
            ->inRandomOrder()
            ->limit(3)
            ->get();

        return response()->json($suggestions);
    }
}

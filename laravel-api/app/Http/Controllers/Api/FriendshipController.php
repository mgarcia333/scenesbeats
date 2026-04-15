<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Friendship;
use App\Models\User;
use App\Models\Activity;
use Illuminate\Http\Request;

class FriendshipController extends Controller
{
    /**
     * List user's friends
     */
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        if (!$userId) return response()->json(['error' => 'user_id required'], 400);

        $user = User::find($userId);
        if (!$user) return response()->json(['error' => 'User not found'], 404);

        return response()->json($user->friends());
    }

    /**
     * List pending requests for a user
     */
    public function pending(Request $request)
    {
        $userId = $request->query('user_id');
        $requests = Friendship::with('sender')
            ->where('recipient_id', $userId)
            ->where('status', 'pending')
            ->get();

        return response()->json($requests);
    }

    /**
     * Send a friend request
     */
    public function store(Request $request)
    {
        $request->validate([
            'sender_id' => 'required|exists:users,id',
            'recipient_id' => 'required|exists:users,id|different:sender_id',
        ]);

        // Check for existing friendship (any status)
        $existing = Friendship::where(function($q) use ($request) {
            $q->where('sender_id', $request->sender_id)->where('recipient_id', $request->recipient_id);
        })->orWhere(function($q) use ($request) {
            $q->where('sender_id', $request->recipient_id)->where('recipient_id', $request->sender_id);
        })->first();

        if ($existing) {
            if ($existing->status === 'rejected') {
                // If rejected, allow re-sending by deleting old record
                $existing->delete();
            } else {
                return response()->json(['error' => 'Relación ya existe o pendiente', 'status' => $existing->status], 400);
            }
        }

        $friendship = Friendship::create([
            'sender_id' => $request->sender_id,
            'recipient_id' => $request->recipient_id,
            'status' => 'pending'
        ]);

        // Real-time notification to the recipient
        \App\Helpers\NodeBroadcaster::broadcast('friend_request', [
            'recipient_id' => $request->recipient_id,
            'from' => $friendship->sender->name,
            'sender_avatar' => $friendship->sender->avatar
        ]);

        return response()->json($friendship, 201);
    }

    /**
     * Accept or Reject a request
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:accepted,rejected'
        ]);

        $friendship = Friendship::with(['sender', 'recipient'])->find($id);
        if (!$friendship) return response()->json(['error' => 'Request not found'], 404);

        $friendship->status = $request->status;
        $friendship->save();

        if ($request->status === 'accepted') {
            // Record activity
            Activity::create([
                'user_id' => $friendship->recipient_id,
                'type' => 'friend_added',
                'subject_id' => $friendship->sender_id,
                'subject_type' => User::class,
                'data' => ['friend_name' => $friendship->sender->name]
            ]);

            // Notify sender
            \App\Helpers\NodeBroadcaster::broadcast('friend_accepted', [
                'recipient_id' => $friendship->sender_id,
                'friend_name' => $friendship->recipient->name
            ]);
        }

        return response()->json($friendship);
    }

    /**
     * Remove a friend or cancel a request
     */
    public function destroy($id)
    {
        $friendship = Friendship::find($id);
        if (!$friendship) return response()->json(['error' => 'Not found'], 404);

        // Notify both users
        \App\Helpers\NodeBroadcaster::broadcast('friend_removed', [
            'user_id' => $friendship->sender_id,
            'friend_id' => $friendship->recipient_id
        ]);
        \App\Helpers\NodeBroadcaster::broadcast('friend_removed', [
            'user_id' => $friendship->recipient_id,
            'friend_id' => $friendship->sender_id
        ]);

        $friendship->delete();
        return response()->json(['message' => 'Eliminado con éxito']);
    }
}

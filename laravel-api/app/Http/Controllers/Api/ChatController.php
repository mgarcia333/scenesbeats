<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * Get messages for a specific room
     */
    public function index($room_id)
    {
        $messages = ChatMessage::with('user')
            ->where('room_id', $room_id)
            ->orderBy('created_at', 'asc')
            ->limit(100)
            ->get();

        return response()->json($messages);
    }

    /**
     * Store a new message
     */
    public function store(Request $request, $room_id)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'content' => 'nullable|string',
            'type' => 'required|string|in:text,gif,movie,song,list,album,artist',
            'gif_url' => 'nullable|string',
            'item_id' => 'nullable|string',
            'item_type' => 'nullable|string',
            'item_title' => 'nullable|string',
            'item_image' => 'nullable|string',
            'item_subtitle' => 'nullable|string',
        ]);

        $message = ChatMessage::create([
            'room_id' => $room_id,
            'user_id' => $validated['user_id'],
            'content' => $validated['content'] ?? null,
            'type' => $validated['type'],
            'gif_url' => $validated['gif_url'] ?? null,
            'item_id' => $validated['item_id'] ?? null,
            'item_type' => $validated['item_type'] ?? null,
            'item_title' => $validated['item_title'] ?? null,
            'item_image' => $validated['item_image'] ?? null,
            'item_subtitle' => $validated['item_subtitle'] ?? null,
        ]);

        return response()->json($message->load('user'), 201);
    }
}

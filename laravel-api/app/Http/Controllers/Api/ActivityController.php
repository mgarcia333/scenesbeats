<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Get community feed
     */
    public function index(Request $request)
    {
        // For now, get all activities. Later filter by only friends.
        $activities = Activity::with(['user', 'subject'])
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        return response()->json($activities);
    }

    /**
     * Store a new activity manually if needed
     */
    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'type' => 'required|string',
            'data' => 'nullable|array'
        ]);

        $activity = Activity::create($request->all());
        return response()->json($activity, 201);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RecommendationHistory;
use Illuminate\Http\Request;

class RecommendationHistoryController extends Controller
{
    /**
     * Get the latest recommendations for a user
     */
    public function index(Request $request)
    {
        $userId = $request->query('user_id');
        if (!$userId) return response()->json(['error' => 'user_id required'], 400);

        $recommendations = RecommendationHistory::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        return response()->json($recommendations);
    }

    /**
     * Store multiple recommendations history records
     */
    public function storeBatch(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'recommendations' => 'required|array',
            'recommendations.*.type' => 'required|string',
            'recommendations.*.titulo' => 'required|string',
        ]);

        $userId = $request->user_id;
        $inserted = [];

        foreach ($request->recommendations as $rec) {
            $inserted[] = RecommendationHistory::create([
                'user_id' => $userId,
                'type' => $rec['tipo'] ?? $rec['type'] ?? 'movie',
                'title' => $rec['titulo'] ?? $rec['title'],
                'subtitle' => $rec['subtitulo'] ?? $rec['subtitle'] ?? null,
                'image_url' => $rec['image_url'] ?? null,
                'external_id' => $rec['external_id'] ?? null,
                'reason' => $rec['motivo'] ?? $rec['reason'] ?? null,
            ]);
        }

        return response()->json(['message' => 'Recommendations saved successfully', 'saved' => count($inserted)], 201);
    }
}

<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NodeBroadcaster
{
    /**
     * Send a broadcast request to the Node.js server.
     */
    public static function broadcast(string $event, array $data)
    {
        try {
            $nodeUrl = env('NODE_API_URL', 'http://127.0.0.1:5000');
            Http::post("{$nodeUrl}/api/internal/broadcast", [
                'event' => $event,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to broadcast to Node.js: " . $e->getMessage());
        }
    }
}

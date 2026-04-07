<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Sync user data from Node.js (Spotify) into Laravel DB.
     * Handles linking Spotify to existing email accounts.
     */
    public function syncSpotifyUser(Request $request)
    {
        $validated = $request->validate([
            'spotify_id' => 'required|string',
            'name' => 'required|string',
            'email' => 'required|email',
            'avatar' => 'nullable|string',
        ]);

        // 1. Try finding by Spotify ID
        $user = User::where('spotify_id', $validated['spotify_id'])->first();

        if (!$user) {
            // 2. Try finding by Email (to link accounts)
            $user = User::where('email', $validated['email'])->first();
            
            if ($user) {
                // Link Spotify to existing account
                $user->spotify_id = $validated['spotify_id'];
                if (!$user->avatar) $user->avatar = $validated['avatar'];
                $user->save();
            } else {
                // 3. Create new user
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'spotify_id' => $validated['spotify_id'],
                    'avatar' => $validated['avatar'],
                    'password' => Hash::make(Str::random(24)),
                ]);
            }
        } else {
            // Update existing Spotify user data if needed
            $user->update([
                'avatar' => $validated['avatar'],
                'name' => $validated['name'],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'user' => $user
        ]);
    }

    /**
     * Standard Email/Password Registration
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'status' => 'success',
            'user' => $user,
            'message' => 'User registered successfully'
        ], 201);
    }

    /**
     * Standard Email/Password Login
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // In a real Sanctum setup, we would return a token here
        return response()->json([
            'status' => 'success',
            'user' => $user
        ]);
    }

    /**
     * Sync user data from Google into Laravel DB.
     * Note: In production, verify the Google ID Token here.
     */
    public function syncGoogleUser(Request $request)
    {
        $validated = $request->validate([
            'google_id' => 'required|string',
            'name' => 'required|string',
            'email' => 'required|email',
            'avatar' => 'nullable|string',
        ]);

        $user = User::where('google_id', $validated['google_id'])->first();

        if (!$user) {
            $user = User::where('email', $validated['email'])->first();
            
            if ($user) {
                $user->google_id = $validated['google_id'];
                if (!$user->avatar) $user->avatar = $validated['avatar'];
                $user->save();
            } else {
                $user = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'google_id' => $validated['google_id'],
                    'avatar' => $validated['avatar'],
                    'password' => Hash::make(Str::random(24)),
                ]);
            }
        }

        return response()->json([
            'status' => 'success',
            'user' => $user
        ]);
    }

    public function syncLetterboxd(Request $request)
    {
        $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->firstOrFail();
        $user->letterboxd_username = $request->username;
        $user->save();

        return response()->json([
            'status' => 'success',
            'user' => $user
        ]);
    }
}

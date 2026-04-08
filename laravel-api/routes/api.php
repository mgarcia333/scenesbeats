<?php

use App\Http\Controllers\Api\FavoritesController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Favorites CRUD
Route::get('/favorites', [FavoritesController::class, 'index']);
Route::post('/favorites', [FavoritesController::class, 'store']);
Route::delete('/favorites/{id}', [FavoritesController::class, 'destroy']);

// Media Lists CRUD
use App\Http\Controllers\Api\MediaListController;
Route::get('/lists', [MediaListController::class, 'index']);
Route::post('/lists', [MediaListController::class, 'store']);
Route::get('/lists/{id}', [MediaListController::class, 'show']);
Route::put('/lists/{id}', [MediaListController::class, 'update']);
Route::delete('/lists/{id}', [MediaListController::class, 'destroy']);
Route::post('/lists/{id}/items', [MediaListController::class, 'addItem']);
Route::delete('/lists/{id}/items/{itemId}', [MediaListController::class, 'removeItem']);

// Social & Friends
use App\Http\Controllers\Api\FriendshipController;
Route::get('/friendships', [FriendshipController::class, 'index']);
Route::get('/friendships/pending', [FriendshipController::class, 'pending']);
Route::post('/friendships', [FriendshipController::class, 'store']);
Route::put('/friendships/{id}', [FriendshipController::class, 'update']);
Route::delete('/friendships/{id}', [FriendshipController::class, 'destroy']);

// Community Activity
use App\Http\Controllers\Api\ActivityController;
Route::get('/activities', [ActivityController::class, 'index']);

// User Search
Route::get('/users/search', function (Request $request) {
    $query = $request->query('query');
    return App\Models\User::where('name', 'LIKE', "%{$query}%")
        ->orWhere('email', 'LIKE', "%{$query}%")
        ->limit(10)
        ->get();
});

Route::get('/users/{id}', function ($id) {
    return App\Models\User::with(['lists'])->findOrFail($id);
});

// Auth / User Sync
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/sync-spotify', [AuthController::class, 'syncSpotifyUser']);
Route::post('/auth/sync-google', [AuthController::class, 'syncGoogleUser']);
Route::post('/auth/sync-letterboxd', [AuthController::class, 'syncLetterboxd']);


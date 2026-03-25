<?php

use App\Http\Controllers\Api\FavoritesController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Favorites CRUD
Route::get('/favorites', [FavoritesController::class, 'index']);
Route::post('/favorites', [FavoritesController::class, 'store']);
Route::delete('/favorites/{id}', [FavoritesController::class, 'destroy']);

// Auth / User Sync
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/sync-spotify', [AuthController::class, 'syncSpotifyUser']);
Route::post('/auth/sync-google', [AuthController::class, 'syncGoogleUser']);

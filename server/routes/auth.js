import express from 'express';
import { loginWithSpotify, spotifyCallback, getCurrentUser, logout } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   GET /api/auth/spotify
 * @desc    Redirect to Spotify Login
 */
router.get('/spotify', loginWithSpotify);

/**
 * @route   GET /api/auth/spotify/callback
 * @desc    Spotify Auth Callback handler
 */
router.get('/spotify/callback', spotifyCallback);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user info
 */
router.get('/me', getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear cookies
 */
router.post('/logout', logout);

export default router;

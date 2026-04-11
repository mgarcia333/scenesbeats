import express from 'express';
import {
  loginWithSpotify,
  connectSpotify,
  spotifyCallback,
  getCurrentUser,
  getSpotifyStatus,
  logout
} from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   GET /api/auth/spotify
 * @desc    Redirect to Spotify Login (main auth flow)
 */
router.get('/spotify', loginWithSpotify);

/**
 * @route   GET /api/auth/spotify/connect
 * @desc    Redirect to Spotify OAuth to connect to an existing account
 */
router.get('/spotify/connect', connectSpotify);

/**
 * @route   GET /api/auth/spotify/callback
 * @desc    Spotify Auth Callback handler (for both login and connect)
 */
router.get('/spotify/callback', spotifyCallback);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user info (requires Spotify cookie)
 */
router.get('/me', getCurrentUser);

/**
 * @route   GET /api/auth/spotify/status
 * @desc    Check if Spotify is connected (fast cookie check, no external call)
 */
router.get('/spotify/status', getSpotifyStatus);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear cookies
 */
router.post('/logout', logout);

export default router;

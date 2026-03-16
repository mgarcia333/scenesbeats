import express from 'express';
import { getTopItems, getRecentlyPlayed, getAudioFeatures, getRecommendations } from '../controllers/spotifyController.js';
import { requireSpotifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply middleware to all routes in this router
router.use(requireSpotifyToken);

/**
 * @route   GET /api/spotify/top/:type
 * @desc    Get User's Top Artists or Tracks
 */
router.get('/top/:type', getTopItems);

/**
 * @route   GET /api/spotify/recently-played
 * @desc    Get User's Recently Played Tracks
 */
router.get('/recently-played', getRecentlyPlayed);

/**
 * @route   GET /api/spotify/audio-features
 * @desc    Get Audio Features for Multiple Tracks
 */
router.get('/audio-features', getAudioFeatures);

/**
 * @route   GET /api/spotify/recommendations
 * @desc    Get Recommendations based on seeds
 */
router.get('/recommendations', getRecommendations);

export default router;

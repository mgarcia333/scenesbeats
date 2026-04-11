import express from 'express';
import { 
  generateRecommendation, 
  getTrendingMovies, 
  getInitialCommunityData, 
  generateFromList,
  completePlaylist
} from '../controllers/recommendationController.js';
import { requireSpotifyToken, injectSpotifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/recommendation/generate
 * @desc    Generate movie recommendation (Spotify token optional — degrades gracefully)
 * @access  Public
 */
router.post('/generate', injectSpotifyToken, generateRecommendation);

/**
 * @route   GET /api/recommendation/trending
 * @desc    Get trending movies from TMDB
 * @access  Public
 */
router.get('/trending', getTrendingMovies);

/**
 * @route   GET /api/recommendation/initial-data
 * @desc    Get initial data for Community view
 * @access  Public (Spotify optional for song recommendations)
 */
router.get('/initial-data', injectSpotifyToken, getInitialCommunityData);

/**
 * @route   POST /api/recommendation/generate-from-list
 * @desc    Generate a recommendation from a specific List context
 * @access  Public
 */
router.post('/generate-from-list', generateFromList);

/**
 * @route   POST /api/recommendation/complete-list
 * @desc    Generate multiple recommendations to complete a list
 * @access  Public
 */
router.post('/complete-list', injectSpotifyToken, completePlaylist);

export default router;

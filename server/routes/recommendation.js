import express from 'express';
import { generateRecommendation, getTrendingMovies, getInitialCommunityData } from '../controllers/recommendationController.js';
import { requireSpotifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/recommendation/generate
 * @desc    Generate movie recommendation based on Spotify history
 * @access  Private
 */
router.post('/generate', requireSpotifyToken, generateRecommendation);

/**
 * @route   GET /api/recommendation/trending
 * @desc    Get trending movies from TMDB
 * @access  Public
 */
router.get('/trending', getTrendingMovies);

/**
 * @route   GET /api/recommendation/initial-data
 * @desc    Get initial data for Community view (Trending movies + Recommended songs)
 * @access  Private (Needs Spotify token for song recommendations)
 */
router.get('/initial-data', requireSpotifyToken, getInitialCommunityData);

export default router;

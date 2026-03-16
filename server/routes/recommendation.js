import express from 'express';
import { generateRecommendation } from '../controllers/recommendationController.js';
import { requireSpotifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/recommendation/generate
 * @desc    Generate movie recommendation based on Spotify history
 * @access  Private
 */
router.post('/generate', requireSpotifyToken, generateRecommendation);

export default router;

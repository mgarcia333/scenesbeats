import express from 'express';
import { 
  getTopItems, getRecentlyPlayed, getAudioFeatures, getRecommendations, 
  searchSpotify, createPlaylist, getTrackDetails 
} from '../controllers/spotifyController.js';
import { requireSpotifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply middleware to all routes in this router
router.use(requireSpotifyToken);

router.get('/top/:type', getTopItems);
router.get('/recently-played', getRecentlyPlayed);
router.get('/audio-features', getAudioFeatures);
router.get('/search', searchSpotify);
router.get('/recommendations', getRecommendations);
router.get('/track/:id', getTrackDetails);

/**
 * @route   POST /api/spotify/playlist
 * @desc    Create a Spotify playlist from a media list's songs
 * @access  Private (Spotify required)
 */
router.post('/playlist', createPlaylist);

export default router;

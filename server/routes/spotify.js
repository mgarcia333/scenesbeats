import express from 'express';
import axios from 'axios';

const router = express.Router();

// Middleware to ensure user is authenticated
const requireSpotifyToken = (req, res, next) => {
  const accessToken = req.cookies.spotify_access_token;
  if (!accessToken) {
    return res.status(401).json({ error: 'No Spotify access token found' });
  }
  req.spotifyToken = accessToken;
  next();
};

// Apply middleware to all routes in this router
router.use(requireSpotifyToken);

// 1. Get User's Top Artists or Tracks
router.get('/top/:type', async (req, res) => {
  const { type } = req.params; // 'artists' or 'tracks'
  const time_range = req.query.time_range || 'medium_term';
  const limit = req.query.limit || 20;

  try {
    const response = await axios.get(`https://api.spotify.com/v1/me/top/${type}?time_range=${time_range}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching top items:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch top items' });
  }
});

// 2. Get User's Recently Played Tracks
router.get('/recently-played', async (req, res) => {
  const limit = req.query.limit || 20;

  try {
    const response = await axios.get(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching recently played:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch recently played' });
  }
});

// 3. Get Audio Features for Multiple Tracks
router.get('/audio-features', async (req, res) => {
  const { ids } = req.query; // Comma-separated list of Spotify track IDs

  if (!ids) {
    return res.status(400).json({ error: 'Missing track IDs param' });
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching audio features:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch audio features' });
  }
});

// 4. Get Recommendations based on seeds
router.get('/recommendations', async (req, res) => {
  const searchParams = new URLSearchParams(req.query).toString();
  // Example queries: seed_artists, seed_genres, seed_tracks, target_energy, target_valence

  try {
    const response = await axios.get(`https://api.spotify.com/v1/recommendations?${searchParams}`, {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching recommendations:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch recommendations' });
  }
});

export default router;

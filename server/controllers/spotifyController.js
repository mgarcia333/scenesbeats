import axios from 'axios';

/**
 * Controller to fetch user's top artists or tracks.
 */
export const getTopItems = async (req, res) => {
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
};

/**
 * Controller to fetch user's recently played tracks.
 */
export const getRecentlyPlayed = async (req, res) => {
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
};

/**
 * Controller to fetch audio features for multiple tracks.
 */
export const getAudioFeatures = async (req, res) => {
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
};

/**
 * Controller to fetch Spotify recommendations based on seeds.
 */
export const getRecommendations = async (req, res) => {
  const searchParams = new URLSearchParams(req.query).toString();

  try {
    const response = await axios.get(`https://api.spotify.com/v1/recommendations?${searchParams}`, {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching recommendations:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed to fetch recommendations' });
  }
};
/**
 * Controller to search for Spotify tracks or artists.
 */
export const searchSpotify = async (req, res) => {
  const { query, type = 'track' } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=20`, {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Spotify Search Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Search failed' });
  }
};

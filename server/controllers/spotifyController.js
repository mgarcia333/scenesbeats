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
  const { limit = 20, before } = req.query;
  const url = `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}${before ? `&before=${before}` : ''}`;

  try {
    const response = await axios.get(url, {
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

/**
 * Controller to create a Spotify playlist from a media list's songs.
 * Steps: 1) Get current user's Spotify ID, 2) Create playlist, 3) Search each song, 4) Add tracks
 */
export const createPlaylist = async (req, res) => {
  const { name, description = '', songs = [] } = req.body;

  if (!req.spotifyToken) {
    return res.status(401).json({ error: 'Spotify not connected' });
  }
  if (!songs.length) {
    return res.status(400).json({ error: 'No songs provided' });
  }

  try {
    // 1. Get current Spotify user ID
    const meRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });
    const userId = meRes.data.id;

    // 2. Create the playlist
    const playlistRes = await axios.post(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        name: `ScenesBeats: ${name}`,
        description: description || `Lista creada desde ScenesBeats`,
        public: false
      },
      { headers: { 'Authorization': `Bearer ${req.spotifyToken}`, 'Content-Type': 'application/json' } }
    );
    const playlistId = playlistRes.data.id;
    const playlistUrl = playlistRes.data.external_urls.spotify;

    // 3. Search for each song and collect URIs
    const trackUris = [];
    for (const song of songs.slice(0, 50)) { // Spotify playlist max add = 100, keep 50 to be safe
      try {
        const query = `${song.title} ${song.subtitle || ''}`.trim();
        const searchRes = await axios.get(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
          { headers: { 'Authorization': `Bearer ${req.spotifyToken}` } }
        );
        const track = searchRes.data.tracks?.items?.[0];
        if (track) trackUris.push(track.uri);
      } catch (e) {
        console.warn(`Could not find track: ${song.title}`);
      }
    }

    // 4. Add tracks to playlist (if any found)
    if (trackUris.length > 0) {
      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: trackUris },
        { headers: { 'Authorization': `Bearer ${req.spotifyToken}`, 'Content-Type': 'application/json' } }
      );
    }

    res.json({
      success: true,
      playlist_url: playlistUrl,
      playlist_id: playlistId,
      tracks_added: trackUris.length
    });

  } catch (error) {
    console.error('Create Playlist Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: 'Failed to create playlist' });
  }
};

/**
 * Get track details from Spotify by ID
 */
export const getTrackDetails = async (req, res) => {
  let { id } = req.params;
  
  // Patch for legacy corrupted IDs (e.g. 5cc7YU35GPW2gXWcWW3Zbk-0)
  if (id.includes('-')) {
    id = id.split('-')[0];
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });
    
    const track = response.data;
    res.json({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      artwork: track.album.images[0]?.url,
      release_date: track.album.release_date,
      duration_ms: track.duration_ms,
      preview_url: track.preview_url,
      external_url: track.external_urls.spotify
    });
  } catch (error) {
    console.error(`Spotify Detail Error for track ${id}:`, error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch track details' });
  }
};

/**
 * Search artists using Spotify API
 */
export const searchArtists = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      params: {
        q: query,
        type: 'artist',
        limit: 10
      },
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });

    const artists = response.data.artists.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres?.slice(0, 3).join(', '),
      image: artist.images?.[0]?.url || null,
      followers: artist.followers?.total,
      external_url: artist.external_urls.spotify
    }));

    res.json(artists);
  } catch (error) {
    console.error('Spotify Artist Search Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Artist search failed' });
  }
};

/**
 * Controller to fetch user's currently playing track.
 */
export const getCurrentlyPlaying = async (req, res) => {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });
    
    // Spotify returns 204 if nothing is playing
    if (response.status === 204 || !response.data) {
      return res.json({ is_playing: false });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching currently playing:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Failed' });
  }
};

/**
 * Search tracks using Spotify API
 */
export const searchTracks = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      params: {
        q: query,
        type: 'track',
        limit: 10
      },
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });

    const tracks = (response.data.tracks?.items || []).map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists?.[0]?.name,
      image: track.album?.images?.[0]?.url || null,
      external_url: track.external_urls.spotify
    }));

    res.json(tracks);
  } catch (error) {
    console.error('Spotify Track Search Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Track search failed' });
  }
};

/**
 * Search albums using Spotify API
 */
export const searchAlbums = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/search`, {
      params: {
        q: query,
        type: 'album',
        limit: 10
      },
      headers: { 'Authorization': `Bearer ${req.spotifyToken}` }
    });

    const albums = (response.data.albums?.items || []).map(album => ({
      id: album.id,
      name: album.name,
      artist: album.artists?.[0]?.name,
      image: album.images?.[0]?.url || null,
      external_url: album.external_urls.spotify
    }));

    res.json(albums);
  } catch (error) {
    console.error('Spotify Album Search Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Album search failed' });
  }
};


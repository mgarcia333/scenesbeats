import { refreshSpotifyToken, setSpotifyCookies } from '../utils/spotifyAuth.js';

/**
 * Middleware to ensure the user is authenticated with Spotify.
 * Checks for 'spotify_access_token' in cookies.
 * If missing, attempts logic for automatic renewal using refresh_token.
 */
export const requireSpotifyToken = async (req, res, next) => {
  let accessToken = req.cookies.spotify_access_token;
  const refreshToken = req.cookies.spotify_refresh_token;

  if (!accessToken && refreshToken) {
    try {
      console.log('🔄 Access token missing, attempting to refresh Spotify session...');
      const tokens = await refreshSpotifyToken(refreshToken);
      setSpotifyCookies(res, tokens);
      accessToken = tokens.access_token;
    } catch (error) {
      console.error('❌ Failed to refresh Spotify token in middleware');
      return res.status(401).json({ error: 'Spotify session expired and refresh failed' });
    }
  }

  if (!accessToken) {
    return res.status(401).json({ error: 'No Spotify access token found' });
  }

  req.spotifyToken = accessToken;
  next();
};

/**
 * Optional Spotify token injection — attaches token if present but never blocks the request.
 * Attempts refresh if access_token is missing but refresh exists.
 */
export const injectSpotifyToken = async (req, res, next) => {
  let accessToken = req.cookies.spotify_access_token;
  const refreshToken = req.cookies.spotify_refresh_token;

  if (!accessToken && refreshToken) {
    try {
      const tokens = await refreshSpotifyToken(refreshToken);
      setSpotifyCookies(res, tokens);
      accessToken = tokens.access_token;
    } catch (error) {
      // Just ignore on optional injection
    }
  }

  req.spotifyToken = accessToken || null;
  next();
};

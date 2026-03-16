/**
 * Middleware to ensure the user is authenticated with Spotify.
 * Checks for 'spotify_access_token' in cookies and attaches it to the request object.
 */
export const requireSpotifyToken = (req, res, next) => {
  const accessToken = req.cookies.spotify_access_token;
  if (!accessToken) {
    return res.status(401).json({ error: 'No Spotify access token found' });
  }
  req.spotifyToken = accessToken;
  next();
};

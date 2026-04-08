import axios from 'axios';

/**
 * Perform a token refresh with Spotify API.
 * Returns new access_token or throws error.
 */
export const refreshSpotifyToken = async (refreshToken) => {
  if (!refreshToken) throw new Error('No refresh token provided');

  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
      }
    });

    return response.data; // { access_token, expires_in, scope, token_type }
  } catch (error) {
    console.error('Spotify Refresh Error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Utility to set/update Spotify cookies on the response object.
 */
export const setSpotifyCookies = (res, tokens) => {
  const { access_token, refresh_token, expires_in } = tokens;

  if (access_token) {
    res.cookie('spotify_access_token', access_token, {
      httpOnly: true,
      maxAge: expires_in * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }

  if (refresh_token) {
    res.cookie('spotify_refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }
};

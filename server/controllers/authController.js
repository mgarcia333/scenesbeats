import axios from 'axios';
import { getSpotifyAuthUrl } from '../utils/spotify.js';
import { syncUserWithLaravel } from '../utils/laravel.js';

/**
 * Controller for Spotify authentication.
 * Handles the redirect to Spotify's authorization page.
 */
export const loginWithSpotify = (req, res) => {
  const url = getSpotifyAuthUrl();
  res.redirect(url);
};

/**
 * Controller for Spotify authentication callback.
 * Exchanges the authorization code for access and refresh tokens.
 */
export const spotifyCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/?error=no_code_provided`);
  }

  try {
    const params = new URLSearchParams({
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const response = await axios.post('https://accounts.spotify.com/api/token', params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
      }
    });

    const { access_token, refresh_token, expires_in } = response.data;

    // Fetch Spotify profile to sync with Laravel
    const spotifyProfile = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    await syncUserWithLaravel(spotifyProfile.data);

    res.cookie('spotify_access_token', access_token, {
      httpOnly: true,
      maxAge: expires_in * 1000,
      secure: process.env.NODE_ENV === 'production'
    });

    res.cookie('spotify_refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production'
    });

    console.log('Spotify login successful, redirecting to home.');
    res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (error) {
    console.error('Error during Spotify Auth Callback:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/?error=spotify_auth_failed`);
  }
};

/**
 * Controller to get the current user profile from Spotify.
 */
export const getCurrentUser = async (req, res) => {
  const accessToken = req.cookies.spotify_access_token;
  if (!accessToken) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const laravelSync = await syncUserWithLaravel(response.data);

    return res.json({ 
      authenticated: true, 
      user: {
        id: laravelSync.user.id, // Internal Laravel ID
        spotify_id: response.data.id,
        name: response.data.display_name,
        email: response.data.email,
        image: response.data.images?.[0]?.url || null
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    res.status(401).json({ authenticated: false });
  }
};

/**
 * Controller to logout by clearing Spotify cookies.
 */
export const logout = (req, res) => {
  res.clearCookie('spotify_access_token');
  res.clearCookie('spotify_refresh_token');
  res.json({ message: 'Logged out successfully' });
};

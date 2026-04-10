import axios from 'axios';
import { getSpotifyAuthUrl } from '../utils/spotify.js';
import { syncUserWithLaravel } from '../utils/laravel.js';

/**
 * Redirect to Spotify login (main auth flow — state='login').
 */
export const loginWithSpotify = (req, res) => {
  const url = getSpotifyAuthUrl('login');
  res.redirect(url);
};

/**
 * Redirect to Spotify OAuth for connecting to an existing account (state='connect').
 * Called when a user already has a session (Google) and wants to add Spotify.
 */
export const connectSpotify = (req, res) => {
  const url = getSpotifyAuthUrl('connect');
  res.redirect(url);
};

/**
 * Spotify OAuth callback.
 * Handles both 'login' and 'connect' states.
 */
export const spotifyCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state || 'login';

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

    // Set Spotify cookies (httpOnly, so JS can't read them — server reads them)
    res.cookie('spotify_access_token', access_token, {
      httpOnly: true,
      maxAge: expires_in * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.cookie('spotify_refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Redirect based on state: 'connect' goes back to profile, 'login' goes to home
    if (state === 'connect') {
      console.log('Spotify connected to existing account, redirecting to profile.');
      return res.redirect(`${process.env.FRONTEND_URL}/profile?spotify=connected`);
    }

    console.log('Spotify login successful, redirecting to home.');
    res.redirect(`${process.env.FRONTEND_URL}/`);
  } catch (error) {
    console.error('Error during Spotify Auth Callback:', error.response?.data || error.message);
    const redirectPath = state === 'connect' ? '/profile?error=spotify_auth_failed' : '/?error=spotify_auth_failed';
    res.redirect(`${process.env.FRONTEND_URL}${redirectPath}`);
  }
};

/**
 * Get the current authenticated user profile from Spotify.
 */
export const getCurrentUser = async (req, res) => {
  const accessToken = req.cookies.spotify_access_token;
  if (!accessToken) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const laravelSync = await syncUserWithLaravel(response.data);

    return res.json({
      authenticated: true,
      user: {
        id: laravelSync.user.id,
        spotify_id: response.data.id,
        name: response.data.display_name,
        email: response.data.email,
        avatar: response.data.images?.[0]?.url || null,
        image: response.data.images?.[0]?.url || null, // Keep for backward compatibility
        letterboxd_username: laravelSync.user.letterboxd_username || null,
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    res.status(401).json({ authenticated: false });
  }
};

/**
 * Check if a Spotify token exists (cookie-based check, no external call).
 */
export const getSpotifyStatus = (req, res) => {
  const accessToken = req.cookies.spotify_access_token;
  res.json({ connected: !!accessToken });
};

/**
 * Logout — clear Spotify cookies and auth data.
 */
export const logout = (req, res) => {
  res.clearCookie('spotify_access_token');
  res.clearCookie('spotify_refresh_token');
  res.json({ message: 'Logged out successfully' });
};

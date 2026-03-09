import express from 'express';
import axios from 'axios';
import { getSpotifyAuthUrl } from '../utils/spotify.js';

const router = express.Router();

router.get('/spotify', (req, res) => {
  const url = getSpotifyAuthUrl();
  res.redirect(url);
});

router.get('/spotify/callback', async (req, res) => {
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

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Error during Spotify Auth Callback:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/?error=spotify_auth_failed`);
  }
});

router.get('/me', async (req, res) => {
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

    return res.json({ 
      authenticated: true, 
      user: {
        name: response.data.display_name,
        email: response.data.email,
        image: response.data.images?.[0]?.url || null
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error.response?.data || error.message);
    res.status(401).json({ authenticated: false });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('spotify_access_token');
  res.clearCookie('spotify_refresh_token');
  res.json({ message: 'Logged out successfully' });
});

export default router;

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, laravelApi } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);         // User data from DB (id, name, email, avatar, letterboxd_username)
  const [spotifyConnected, setSpotifyConnected] = useState(false); // Spotify cookie present
  const [loading, setLoading] = useState(true);

  /**
   * Initialize auth state on app start.
   * Strategy:
   * 1. Check if Spotify session exists via /api/auth/me (reads httpOnly cookies)
   * 2. If yes → authenticated via Spotify, use that user
   * 3. If no → check localStorage for a Google-authenticated user
   * 4. In both cases, also check Spotify status separately for the "connect" badge
   */
  const initAuth = useCallback(async () => {
    setLoading(true);
    try {
      // Try Spotify session first (most reliable — server-side cookies)
      const meRes = await authApi.getCurrentUser();
      if (meRes.data.authenticated) {
        const userData = {
          ...meRes.data.user,
          avatar: meRes.data.user.image || meRes.data.user.avatar,
        };
        setUser(userData);
        setSpotifyConnected(true);
        localStorage.setItem('user', JSON.stringify(userData));
        setLoading(false);
        return;
      }
    } catch {
      // No Spotify session — check localStorage for Google user
    }

    // Check localStorage for Google-authenticated user
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        // Still check if they have Spotify connected too
        try {
          const statusRes = await authApi.getSpotifyStatus();
          setSpotifyConnected(statusRes.data.connected);
        } catch {
          setSpotifyConnected(false);
        }
      } catch {
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  /**
   * Login with email/password (Laravel)
   */
  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    if (res.data.status === 'success') {
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      // Check if Spotify is also connected
      try {
        const statusRes = await authApi.getSpotifyStatus();
        setSpotifyConnected(statusRes.data.connected);
      } catch {
        setSpotifyConnected(false);
      }
    }
    return res.data;
  };

  /**
   * Register with email/password (Laravel)
   */
  const register = async (data) => {
    const res = await authApi.register(data);
    return res.data;
  };

  /**
   * Sync Google OAuth user with Laravel and set session
   */
  const syncGoogleUser = async (googleData) => {
    const res = await authApi.syncGoogle(googleData);
    if (res.data.status === 'success') {
      const userData = {
        ...res.data.user,
        avatar: googleData.picture || res.data.user.avatar,
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      // Check Spotify separately
      try {
        const statusRes = await authApi.getSpotifyStatus();
        setSpotifyConnected(statusRes.data.connected);
      } catch {
        setSpotifyConnected(false);
      }
    }
    return res.data;
  };

  /**
   * Connect Letterboxd username to the user's account (saved in DB)
   */
  const connectLetterboxd = async (username) => {
    if (!user?.id) throw new Error('No authenticated user');
    const res = await authApi.syncLetterboxd(username, user.id);
    if (res.data.status === 'success') {
      const updatedUser = { ...user, letterboxd_username: username };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    return res.data;
  };

  /**
   * Connect Spotify from the profile (already logged in with Google).
   * Redirects to the Spotify OAuth with state='connect'.
   */
  const connectSpotify = () => {
    window.location.href = '/api/auth/spotify/connect';
  };

  /**
   * Logout — clear cookies (Spotify) and localStorage (Google)
   */
  const logout = async () => {
    try {
      await authApi.logout(); // Clears Spotify cookies on the server
    } catch (err) {
      console.error('Backend logout error:', err);
    }
    setUser(null);
    setSpotifyConnected(false);
    localStorage.removeItem('user');
  };

  /**
   * Manually update user data (e.g., after profile edits)
   */
  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      spotifyConnected,
      login,
      logout,
      register,
      syncGoogleUser,
      connectLetterboxd,
      connectSpotify,
      updateUser,
      refreshAuth: initAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

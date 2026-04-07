import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const res = await authApi.getCurrentUser();
      if (res.data.authenticated) {
        const userData = {
          ...res.data.user,
          // Map image to avatar for consistency with other methods
          avatar: res.data.user.image || res.data.user.avatar
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
    } catch (err) {
      console.error("Check session error:", err);
    }
    return false;
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      
      // Always verify or check if missing (useful after social login redirects)
      if (!savedUser) {
        await checkSession();
      }
      
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    if (res.data.status === 'success') {
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return res.data;
  };

  const register = async (data) => {
    const res = await authApi.register(data);
    return res.data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const syncGoogleUser = async (googleData) => {
      // For now, simple mock or direct sync if backend ready
      const res = await authApi.syncGoogle(googleData);
      if (res.data.status === 'success') {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      return res.data;
  };

  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, register, syncGoogleUser, updateUser, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

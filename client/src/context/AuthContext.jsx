import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, syncGoogleUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

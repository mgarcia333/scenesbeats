import axios from 'axios';

// Node.js API client (Real-time, Spotify, AI)
export const nodeApi = axios.create({
  baseURL: import.meta.env.VITE_NODE_API_URL || '/api', // Proxy in development
  withCredentials: true,
});

// Laravel API client (SQL DB, CRUDs)
export const laravelApi = axios.create({
  baseURL: import.meta.env.VITE_LARAVEL_API_URL || 'http://localhost:8000/api',
});

// API Helpers
export const favoritesApi = {
  getAll: (userId) => laravelApi.get(`/favorites?user_id=${userId}`),
  save: (data) => laravelApi.post('/favorites', data),
  remove: (id) => laravelApi.delete(`/favorites/${id}`),
};

export const authApi = {
  getCurrentUser: () => nodeApi.get('/auth/me'),
  logout: () => nodeApi.post('/auth/logout'),
  register: (data) => laravelApi.post('/auth/register', data),
  login: (data) => laravelApi.post('/auth/login', data),
  syncGoogle: (data) => laravelApi.post('/auth/sync-google', data),
};

export const recommendationApi = {
  generate: (data) => nodeApi.post('/recommendation/generate', data),
  getTrending: () => nodeApi.get('/recommendation/trending'),
  getInitialData: () => nodeApi.get('/recommendation/initial-data'),
};

export const movieApi = {
  search: (query) => nodeApi.get(`/movie/search?query=${query}`),
  getLetterboxd: (username) => nodeApi.get(`/movie/letterboxd/${username}`),
};

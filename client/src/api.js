import axios from 'axios';

// Node.js API client (Real-time, Spotify, AI)
export const nodeApi = axios.create({
  baseURL: import.meta.env.VITE_NODE_API_URL ? `${import.meta.env.VITE_NODE_API_URL}/api` : '/api',
  withCredentials: true,
});

// Interceptor for 401 errors
nodeApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only clear if it's a call that SHOULD have been authenticated
      // or if it's the 'me' call itself
      const isAuthMe = error.config.url.includes('/auth/me');
      if (isAuthMe) {
        console.warn("Session expired (401), clearing local storage.");
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

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

export const listsApi = {
  getAll: (userId) => laravelApi.get(`/lists?user_id=${userId}`),
  getOne: (id) => laravelApi.get(`/lists/${id}`),
  create: (data) => laravelApi.post('/lists', data),
  update: (id, data) => laravelApi.put(`/lists/${id}`, data),
  delete: (id) => laravelApi.delete(`/lists/${id}`),
  addItem: (listId, data) => laravelApi.post(`/lists/${listId}/items`, data),
  removeItem: (listId, itemId) => laravelApi.delete(`/lists/${listId}/items/${itemId}`),
};

export const authApi = {
  getCurrentUser: () => nodeApi.get('/auth/me'),
  logout: () => nodeApi.post('/auth/logout'),
  register: (data) => laravelApi.post('/auth/register', data),
  login: (data) => laravelApi.post('/auth/login', data),
  syncGoogle: (data) => laravelApi.post('/auth/sync-google', data),
  syncLetterboxd: (username, userId) => laravelApi.post('/auth/sync-letterboxd', { username, user_id: userId }),
  getSpotifyStatus: () => nodeApi.get('/auth/spotify/status'),
};

export const recommendationApi = {
  generate: (data) => nodeApi.post('/recommendation/generate', data),
  generateFromList: (data) => nodeApi.post('/recommendation/generate-from-list', data),
  getTrending: () => nodeApi.get('/recommendation/trending'),
  getInitialData: () => nodeApi.get('/recommendation/initial-data'),
};

export const movieApi = {
  search: (query) => nodeApi.get(`/movie/search?query=${query}`),
  getLetterboxd: (username) => nodeApi.get(`/movie/letterboxd/${username}`),
  getOne: (id) => nodeApi.get(`/movie/${id}`),
};

export const spotifyApi = {
  createPlaylist: (data) => nodeApi.post('/spotify/playlist', data),
  getTrack: (id) => nodeApi.get(`/spotify/track/${id}`),
};


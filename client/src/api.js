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
    // We don't clear localStorage here anymore — let AuthContext decide
    // based on specific initialization logic or manual logout.
    if (error.response?.status === 401) {
      console.warn("Unauthorized API call (401):", error.config.url);
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
  addCollaborator: (listId, userId) => laravelApi.post(`/lists/${listId}/collaborators`, { user_id: userId }),
  removeCollaborator: (listId, userId) => laravelApi.delete(`/lists/${listId}/collaborators`, { data: { user_id: userId } }),
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

export const socialApi = {
  getFriends: (userId) => laravelApi.get(`/friendships?user_id=${userId}`),
  getPendingRequests: (userId) => laravelApi.get(`/friendships/pending?user_id=${userId}`),
  sendRequest: (data) => laravelApi.post('/friendships', data),
  updateRequest: (id, status) => laravelApi.put(`/friendships/${id}`, { status }),
  removeFriend: (id) => laravelApi.delete(`/friendships/${id}`),
  getActivities: () => laravelApi.get('/activities'),
  getUserActivities: (id) => laravelApi.get(`/users/${id}/activities`),
  searchUsers: (query) => laravelApi.get(`/users/search?query=${query}`),
  getSuggestions: (userId) => laravelApi.get(`/users/suggestions?user_id=${userId}`),
  getUserProfile: (id) => laravelApi.get(`/users/${id}`),
  createActivity: (data) => laravelApi.post('/activities', data),
};

export const chatApi = {
  getMessages: (roomId) => laravelApi.get(`/chat/${roomId}`),
  saveMessage: (roomId, data) => laravelApi.post(`/chat/${roomId}`, data),
};

export const recommendationApi = {
  generate: (data) => nodeApi.post('/recommendation/generate', data),
  generateFromList: (data) => nodeApi.post('/recommendation/generate-from-list', data),
  completeList: (data) => nodeApi.post('/recommendation/complete-list', data),
  getTrending: () => nodeApi.get('/recommendation/trending'),
  getInitialData: () => nodeApi.get('/recommendation/initial-data'),
  getHistory: (userId) => laravelApi.get(`/recommendations/history?user_id=${userId}`),
};

export const movieApi = {
  search: (query) => nodeApi.get(`/movie/search?query=${query}`),
  getLetterboxd: (username) => nodeApi.get(`/movie/letterboxd/${username}`),
  getOne: (id) => nodeApi.get(`/movie/${id}`),
  searchPeople: (query) => nodeApi.get(`/movie/search-people?query=${query}`),
};

export const spotifyApi = {
  createPlaylist: (data) => nodeApi.post('/spotify/playlist', data),
  getTrack: (id) => nodeApi.get(`/spotify/track/${id}`),
  searchArtists: (query) => nodeApi.get(`/spotify/search-artists?query=${query}`),
  searchTracks: (query) => nodeApi.get(`/spotify/search-tracks?query=${query}`),
  searchAlbums: (query) => nodeApi.get(`/spotify/search-albums?query=${query}`),
  getRecentlyPlayed: (limit = 20) => nodeApi.get(`/spotify/recently-played?limit=${limit}`),
  getCurrentlyPlaying: () => nodeApi.get('/spotify/currently-playing'),
};


import axios from 'axios';

const laravelApi = axios.create({
    baseURL: process.env.LARAVEL_API_URL || 'http://localhost:8000/api',
});

/**
 * Synchronize a user authenticated via Spotify with the Laravel backend.
 */
export const syncUserWithLaravel = async (userData) => {
    try {
        const response = await laravelApi.post('/auth/sync-spotify', {
            spotify_id: userData.id,
            name: userData.display_name,
            email: userData.email,
            avatar: userData.images?.[0]?.url || null,
        });
        return response.data;
    } catch (error) {
        console.error('Error syncing user with Laravel:', error.response?.data || error.message);
        throw error;
    }
};

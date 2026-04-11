import axios from 'axios';

export const laravelApi = axios.create({
    baseURL: process.env.LARAVEL_API_URL || 'http://localhost:8000/api',
});

export const saveRecommendationHistory = async (userId, recommendations) => {
    try {
        if (!userId || !recommendations || recommendations.length === 0) return;
        await laravelApi.post('/recommendations/history', {
            user_id: userId,
            recommendations
        });
    } catch (error) {
        console.error('Error saving recommendation history:', error.response?.data || error.message);
    }
};

export const saveChatMessage = async (roomId, data) => {
    try {
        const response = await laravelApi.post(`/chat/${roomId}`, data);
        return response.data;
    } catch (error) {
        console.error('Error saving chat message to Laravel:', {
            url: error.config?.url,
            payload: data,
            response: error.response?.data || error.message,
            status: error.response?.status
        });
        throw error;
    }
};

/**
 * Save an activity (like a Spotify play) to the Laravel backend.
 */
export const saveActivity = async (data) => {
    try {
        const response = await laravelApi.post('/activities', data);
        return response.data;
    } catch (error) {
        console.error('Error saving activity to Laravel:', error.response?.data || error.message);
    }
};

/**
 * Synchronize a user authenticated via Spotify with the Laravel backend.
 */
export const syncUserWithLaravel = async (userData) => {
    try {
        const avatarUrl = (userData.images && userData.images.length > 0) 
            ? userData.images[0].url 
            : null;

        const response = await laravelApi.post('/auth/sync-spotify', {
            spotify_id: userData.id,
            name: userData.display_name,
            email: userData.email,
            avatar: avatarUrl,
        });
        return response.data;
    } catch (error) {
        console.error('Error syncing user with Laravel:', error.response?.data || error.message);
        throw error;
    }
};

import axios from 'axios';
import { saveActivity } from './laravel.js';

/**
 * SpotifyMonitor
 * Maintains a polling interval for an active socket to detect and notify 
 * of new recently played tracks.
 */
class SpotifyMonitor {
  constructor(io, socket, token) {
    this.io = io;
    this.socket = socket;
    this.token = token;
    this.intervalId = null;
    this.lastPlayedAt = null;
    this.lastTrackId = null;
  }

  async start(intervalMs = 45000) {
    if (this.intervalId) return;

    console.log(`[SpotifyMonitor] Starting for socket ${this.socket.id}`);
    
    // Initial fetch to establish baseline
    await this.poll();

    this.intervalId = setInterval(() => this.poll(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      console.log(`[SpotifyMonitor] Stopping for socket ${this.socket.id}`);
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async poll() {
    try {
      // 1. Poll Currently Playing
      const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      
      const playback = response.data;
      
      // If nothing is playing, playback is empty or is_playing is false
      if (!playback || !playback.is_playing) {
        // Only emit if we previously had activity
        if (this.lastTrackId) {
          this.io.emit('user_activity_update', { 
            userId: this.socket.userId, 
            isPlaying: false 
          });
          this.lastTrackId = null;
        }
        return;
      }

      const track = playback.item;
      if (!track) return;

      // Detect track change or significant time jump (optional)
      if (track.id !== this.lastTrackId) {
        console.log(`[SpotifyMonitor] Broadcast: User ${this.socket.userId} is listening to ${track.name}`);
        
        const activityData = {
          userId: this.socket.userId,
          isPlaying: true,
          track: {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            artwork: track.album.images[0]?.url,
            progress_ms: playback.progress_ms,
            duration_ms: track.duration_ms,
            timestamp: Date.now()
          }
        };

        // 1. Broadcast to Everyone via Sockets
        this.io.emit('user_activity_update', activityData);

        // 2. Persist to Laravel for History
        saveActivity({
          user_id: this.socket.userId,
          type: 'spotify_track',
          data: {
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            artwork: track.album.images[0]?.url,
            spotify_url: track.external_urls?.spotify
          }
        });

        this.lastTrackId = track.id;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.warn(`[SpotifyMonitor] Token expired for user ${this.socket.userId}, stopping.`);
        this.stop();
      } else {
        console.error(`[SpotifyMonitor] Error polling for ${this.socket.userId}:`, error.message);
      }
    }
  }
}

export default SpotifyMonitor;

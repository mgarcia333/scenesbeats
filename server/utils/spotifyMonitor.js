import axios from 'axios';

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
      const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      const latestTrack = response.data.items[0];
      if (!latestTrack) return;

      const playedAt = latestTrack.played_at;

      // If we have a new playedAt timestamp, emit the update
      if (this.lastPlayedAt && playedAt !== this.lastPlayedAt) {
        console.log(`[SpotifyMonitor] New track detected for ${this.socket.id}: ${latestTrack.track.name}`);
        
        const trackData = {
          id: latestTrack.track.id,
          name: latestTrack.track.name,
          artist: latestTrack.track.artists[0].name,
          artwork: latestTrack.track.album.images[0]?.url,
          played_at: latestTrack.played_at
        };

        this.socket.emit('spotify_update', trackData);
      }

      this.lastPlayedAt = playedAt;
    } catch (error) {
      // If token expired or other error, log and potentially stop
      if (error.response?.status === 401) {
        console.warn(`[SpotifyMonitor] Token expired for socket ${this.socket.id}, stopping.`);
        this.stop();
      } else {
        console.error(`[SpotifyMonitor] Error polling for ${this.socket.id}:`, error.message);
      }
    }
  }
}

export default SpotifyMonitor;

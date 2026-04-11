import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { socialApi, favoritesApi, movieApi, spotifyApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, Check, Clock, Film, Music, 
  ChevronLeft, Star, List as ListIcon, Circle, Radio,
  Mail, Flame
} from 'lucide-react';
import HorizontalScroll from '../components/HorizontalScroll';
import { socket } from '../App';
import LoadingDots from '../components/LoadingDots';

const UserProfile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none');
  const [loadingAction, setLoadingAction] = useState(false);
  
  // Design mirror states
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [lbMovies, setLbMovies] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);
  const [recentSongs, setRecentSongs] = useState([]); // We'll try to show these if available
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Real-time activity
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchFriends();
    fetchRecentSongs();
    
    // Socket listener for live activity
    socket.on('user_activity_update', (data) => {
      if (String(data.userId) === String(id)) {
        if (data.isPlaying) {
          setCurrentlyPlaying(data.track);
        } else {
          setCurrentlyPlaying(null);
        }
      }
    });

    return () => {
      socket.off('user_activity_update');
    };
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await socialApi.getUserProfile(id);
      const userData = response.data;
      setProfileUser(userData);
      
      // Load Letterboxd if present
      if (userData.letterboxd_username) {
        fetchLetterboxd(userData.letterboxd_username);
      }

      // Check friendship status with current user
      checkFriendship();
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSongs = async () => {
    setLoadingHistory(true);
    try {
      const res = await socialApi.getUserActivities(id);
      const tracks = (res.data || [])
        .filter(a => a.type === 'spotify_track')
        .map(a => ({
          id: a.data.id,
          name: a.data.name,
          artist: a.data.artist,
          artwork: a.data.artwork,
          spotify_url: a.data.spotify_url
        }));
      setRecentSongs(tracks);
    } catch (err) {
      console.error("Error fetching recent songs history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchFriends = async () => {
    setLoadingFriends(true);
    try {
      // New endpoint I added to Laravel
      const res = await socialApi.getFriends(id);
      setFriendsList(res.data || []);
    } catch (err) {
      console.error("Error fetching friends circle:", err);
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchLetterboxd = async (username) => {
    setLoadingLB(true);
    try {
      const res = await movieApi.getLetterboxd(username);
      setLbMovies(res.data || []);
    } catch (err) {
      console.error("Error fetching Letterboxd history:", err);
    } finally {
      setLoadingLB(false);
    }
  };

  const checkFriendship = async () => {
    try {
      const friendsRes = await socialApi.getFriends(currentUser.id);
      const isFriend = (friendsRes.data || []).some(f => String(f.id) === String(id));
      
      if (isFriend) {
        setFriendStatus('accepted');
      } else {
        const pendingRes = await socialApi.getPendingRequests(currentUser.id);
        const sentPending = (pendingRes.data || []).some(r => String(r.recipient_id) === String(id));
        if (sentPending) setFriendStatus('pending');
      }
    } catch (err) {
      console.warn("Friendship check error:", err);
    }
  };

  const handleAddFriend = async () => {
    setLoadingAction(true);
    try {
      await socialApi.sendRequest({
        sender_id: currentUser.id,
        recipient_id: id
      });
      socket.emit('friend_request', {
        from: currentUser.name,
        toId: id
      });
      setFriendStatus('pending');
    } catch (err) {
      console.error("Error sending friend request:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  // --- Mirror Design Components (Read Only) ---

  const ReadOnlyFavoriteSlot = ({ type, position }) => {
    const fav = (profileUser.favorites || []).find(f => f.type === type && f.position === position);
    const isPerson = type === 'actor_fav' || type === 'director_fav';
    const isMedia = type === 'movie_fav' || type === 'song_fav' || type === 'album_fav';
    
    if (fav) {
      return (
        <div className={`fav-slot-item ${isPerson ? 'person' : ''} ${isMedia ? 'media' : ''}`}>
          <img src={fav.image_url || 'https://placehold.co/80/1a1a1a/ffffff?text=?'} alt="" className="fav-slot-img" />
        </div>
      );
    }

    return (
      <div className={`fav-slot-item empty ${isPerson ? 'person' : ''} ${isMedia ? 'media' : ''}`} style={{ cursor: 'default' }}>
      </div>
    );
  };

  const ReadOnlyGustoSection = ({ title, type, icon: IconComponent }) => {
    return (
      <div className="gusto-category">
        <h3 className="gusto-category-title">
          <IconComponent size={14} /> <span>{title}</span>
        </h3>
        <div className="gusto-row">
          {[1, 2, 3, 4].map(pos => <ReadOnlyFavoriteSlot key={`${type}-${pos}`} type={type} position={pos} />)}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="loader-container">
      <LoadingDots />
    </div>
  );

  if (!profileUser) return (
    <div className="view-container">
      <button className="lv-back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        <ChevronLeft size={20} />
      </button>
      <div className="empty-state">
        <h2>{t('profile.userNotFound')}</h2>
      </div>
    </div>
  );

  return (
    <div className="view-container profile-view animate-fadeIn">
      {/* Header with back button */}
      <div className="profile-top-bar">
        <button className="profile-back-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <h2 className="profile-title-mobile">{t('profile.viewProfile')}</h2>
        <div style={{ width: 20 }} /> {/* Spacer */}
      </div>

      {/* ── Profile header (Mirror) ── */}
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <img 
            src={profileUser.avatar || `https://ui-avatars.com/api/?name=${profileUser.name}`} 
            className="profile-avatar-large" 
            alt={profileUser.name}
          />
        </div>

        <div className="profile-info-main">
          <h2 className="profile-name-large">{profileUser.name}</h2>
          
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{(profileUser.lists || []).length}</span>
              <span className="stat-label">{t('common.lists')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{friendsList.length}</span>
              <span className="stat-label">Amigos</span>
            </div>
          </div>

          <div className="profile-actions-row" style={{ marginTop: '1.25rem' }}>
            {friendStatus === 'accepted' ? (
              <div className="status-badge">
                <Check size={16} /> <span>{t('common.friends')}</span>
              </div>
            ) : friendStatus === 'pending' ? (
              <div className="status-badge pending">
                <Clock size={16} /> <span>{t('social.pending')}</span>
              </div>
            ) : (
              <button 
                className="btn-primary-solid" 
                onClick={handleAddFriend}
                disabled={loadingAction}
              >
                {loadingAction ? <LoadingDots className="compact" /> : <UserPlus size={18} />}
                <span>{t('social.addFriend')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Now Playing (SOCKET SYNC) */}
      {currentlyPlaying && (
        <div className="now-playing-bar" style={{ marginBottom: '2rem' }}>
          <Music size={16} className="np-icon" />
          <div className="np-track-info">
            <span className="np-track-name">{currentlyPlaying.name}</span>
            <span className="np-artist-name">{currentlyPlaying.artist}</span>
          </div>
          <div className="live-indicator">
             <div className="live-dot" />
             <span>EN DIRECTO</span>
          </div>
        </div>
      )}

      {/* ── My Tastes (Favorites) ── */}
      <section className="feed-section">
        <h2 className="section-title">{t('profile.myTastes')}</h2>
        <div className="gustos-container">
          <ReadOnlyGustoSection title={t('profile.movies')} type="movie_fav" icon={Film} />
          <ReadOnlyGustoSection title={t('profile.songs')} type="song_fav" icon={Music} />
          <ReadOnlyGustoSection title={t('profile.albums')} type="album_fav" icon={Radio} />
          <ReadOnlyGustoSection title={t('profile.artists')} type="artist_fav" icon={Music} />
        </div>
      </section>

      {/* ── Recent Music (Spotify History) ── */}
      <section className="feed-section">
        <h2 className="section-title">Música: Escuchado hace poco</h2>
        {loadingHistory ? (
          <div className="loading-inline"><LoadingDots className="mini-loader" /></div>
        ) : (
          <HorizontalScroll>
            {recentSongs.map((song, idx) => (
              <div key={`${song.id}-${idx}`} className="song-card" style={{ flex: '0 0 120px' }}>
                <img src={song.artwork} className="song-artwork" alt={song.name} style={{ width: '120px', height: '120px' }} />
                <div className="song-name" style={{ fontSize: '0.75rem' }}>{song.name}</div>
              </div>
            ))}
            {recentSongs.length === 0 && <p className="text-muted small">No hay actividad reciente.</p>}
          </HorizontalScroll>
        )}
      </section>

      {/* ── Friends Circle (Social Network) ── */}
      <section className="feed-section">
        <h2 className="section-title">Círculo de Amigos ({friendsList.length})</h2>
        {friendsList.length > 0 ? (
          <HorizontalScroll>
            {friendsList.map(friend => (
              <div 
                key={friend.id} 
                className="friend-circle-item" 
                onClick={() => navigate(`/user/${friend.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}`} alt="" className="friend-avatar-circle" />
                <span className="friend-name-small">{friend.name}</span>
              </div>
            ))}
          </HorizontalScroll>
        ) : (
          <p className="text-muted small">Aún no tiene amigos.</p>
        )}
      </section>

      {/* ── Public Lists ── */}
      <section className="feed-section">
        <h2 className="section-title">{t('profile.publicLists')} ({(profileUser.lists || []).length})</h2>
        <HorizontalScroll>
          {(profileUser.lists || []).map(list => (
            <div
              key={list.id}
              className="activity-card"
              style={{ flex: '0 0 160px', height: '100px', cursor: 'pointer' }}
              onClick={() => navigate(`/list/${list.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ListIcon size={16} color="var(--primary-color)" />
                <span className="small font-bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{list.name}</span>
              </div>
              <div className="text-muted small">{list.items_count || 0} elementos</div>
            </div>
          ))}
          {(profileUser.lists || []).length === 0 && (
             <p className="text-muted small">{t('profile.noPublicLists')}</p>
          )}
        </HorizontalScroll>
      </section>

      {/* ── External History (Letterboxd) ── */}
      {profileUser.letterboxd_username && (
        <section className="feed-section">
          <h2 className="section-title">Cine: Visto hace poco</h2>
          {loadingLB ? (
            <div className="loading-inline"><LoadingDots className="mini-loader" /></div>
          ) : (
            <HorizontalScroll>
              {lbMovies.map((movie, idx) => (
                <div key={`${movie.id}-${idx}`} className="movie-card" style={{ flex: '0 0 100px' }}>
                  <img src={movie.poster} className="movie-artwork" alt={movie.title} style={{ width: '100px', height: '150px' }} />
                  <div className="movie-name" style={{ fontSize: '0.75rem' }}>{movie.title}</div>
                </div>
              ))}
              {lbMovies.length === 0 && <p className="text-muted small">No hay actividad reciente.</p>}
            </HorizontalScroll>
          )}
        </section>
      )}

      {/* ── Connections ── */}
      <section className="feed-section">
        <h2 className="section-title">{t('profile.connections')}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {profileUser.spotify_id && (
            <div className="connection-badge connected">
              <Music size={14} /> <span>Spotify</span>
              <Check size={12} />
            </div>
          )}
          {profileUser.letterboxd_username && (
            <div className="connection-badge connected lb">
              <Film size={14} /> <span>Letterboxd</span>
              <Check size={12} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserProfile;


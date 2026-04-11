import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socialApi, spotifyApi, movieApi, favoritesApi, listsApi, authApi } from '../api';
import {
  Music, Film, Star, PlusCircle, Circle, Check, Plus,
  X, ExternalLink, RefreshCw, LogOut, Radio, List as ListIcon,
  Search, Trash2, Clock, Flame
} from 'lucide-react';
import LoadingDots from '../components/LoadingDots';
import HorizontalScroll from '../components/HorizontalScroll';

/* ─────────────────────────────────────────────
   Favorite Search Modal
──────────────────────────────────────────── */
const FavoriteSearchModal = ({ type, position, onClose, onSave, userId }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (val) => {
    setQuery(val);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (val.length < 2) {
      setResults([]);
      return;
    }
    
    // Debounce search
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        let res;
        switch (type) {
          case 'movie_fav':
            res = await movieApi.search(val);
            setResults(res.data.map(m => ({
              id: m.id,
              title: m.title,
              subtitle: m.year,
              image: m.poster
            })));
            break;
          case 'actor_fav':
          case 'director_fav':
            res = await movieApi.searchPeople(val);
            setResults(res.data.map(p => ({
              id: p.id,
              title: p.name,
              subtitle: p.known_for,
              image: p.image
            })));
            break;
          case 'song_fav':
            res = await spotifyApi.searchTracks(val);
            setResults(res.data.map(t => ({
              id: t.id,
              title: t.name,
              subtitle: t.artist,
              image: t.image
            })));
            break;
          case 'album_fav':
            res = await spotifyApi.searchAlbums(val);
            setResults(res.data.map(a => ({
              id: a.id,
              title: a.name,
              subtitle: a.artist,
              image: a.image
            })));
            break;
          case 'artist_fav':
            res = await spotifyApi.searchArtists(val);
            setResults(res.data.map(a => ({
              id: a.id,
              title: a.name,
              subtitle: a.genres,
              image: a.image
            })));
            break;
          default:
            setResults([]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    
    setSearchTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  const selectItem = async (item) => {
    if (loading) return;
    setLoading(true);
    try {
      const success = await onSave({
        user_id: userId,
        type,
        position,
        external_id: String(item.id),
        title: item.title,
        subtitle: item.subtitle,
        image_url: item.image
      });
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error("Save error:", err);
      alert('Error al guardar: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card favorite-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Buscar</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="fav-search-box">
          <Search size={14} className="fav-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="fav-search-input"
            placeholder="Buscar..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="fav-search-results">
          {loading && <div className="loading-inline"><LoadingDots className="mini-loader" /></div>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <p className="text-muted small" style={{ textAlign: 'center', padding: '1rem' }}>Sin resultados</p>
          )}
          {!loading && results.map(item => (
            <div key={item.id} className="fav-result-row" onClick={() => selectItem(item)}>
              <img src={item.image || 'https://placehold.co/36/1a1a1a/ffffff?text=?'} alt="" className="fav-result-img" />
              <div className="fav-result-info">
                <div className="fav-result-title">{item.title}</div>
                <div className="fav-result-sub">{item.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Letterboxd modal
───────────────────────────────────────────── */
const LetterboxdModal = ({ onClose, onSave, currentUsername }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState(currentUsername || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError(t('profile.lbError'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSave(trimmed);
      onClose();
    } catch (err) {
      setError(t('profile.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card lb-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="icon-letterboxd"><Film size={20} /></span>
            <h3 className="modal-title">{t('profile.modalTitle')}</h3>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <p className="modal-description">
          {t('profile.modalDesc').split('Letterboxd')[0]}
          <a href="https://letterboxd.com" target="_blank" rel="noopener noreferrer" className="link-accent">
            Letterboxd <ExternalLink size={12} style={{ display: 'inline' }} />
          </a>{' '}
          {t('profile.modalDesc').split('Letterboxd')[1]}
        </p>

        <div className="modal-input-group">
          <span className="modal-input-prefix">letterboxd.com/</span>
          <input
            ref={inputRef}
            type="text"
            className="modal-input"
            placeholder="tu_usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            disabled={loading}
          />
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose} disabled={loading}>
            {t('profile.cancel')}
          </button>
          <button
            className="modal-btn-save"
            onClick={handleSave}
            disabled={loading || !username.trim()}
          >
            {loading ? <LoadingDots className="mini-loader" /> : <Check size={16} />}
            {loading ? t('profile.saving') : t('profile.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Star renderer helper
───────────────────────────────────────────── */
const renderStars = (rating) => {
  if (!rating) return null;
  const num = parseFloat(rating);
  const fullStars = Math.floor(num);
  const halfStar = num % 1 !== 0;
  return (
    <div className="stars-container">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={i} size={11} fill="currentColor" style={{ display: 'inline' }} />
      ))}
      {halfStar ? '½' : ''}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Profile view
───────────────────────────────────────────── */
const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, spotifyConnected, setSpotifyConnected, connectLetterboxd, connectSpotify, refreshAuth } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [lbMovies, setLbMovies] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);
  const [recentSongs, setRecentSongs] = useState([]);
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [showLBModal, setShowLBModal] = useState(false);
  const [spotifyJustConnected, setSpotifyJustConnected] = useState(false);

  // Stats counts
  const [spotifyTodayCount, setSpotifyTodayCount] = useState(0);
  const [letterboxdThisMonth, setLetterboxdThisMonth] = useState(0);

  // Real user content
  const [myLists, setMyLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [myFavorites, setMyFavorites] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Slot management
  const [activeSlot, setActiveSlot] = useState(null); // { type, position }

  // Real-time Spotify playback
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  // Detect when Spotify was just connected (redirect from OAuth)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('spotify') === 'connected') {
      setSpotifyJustConnected(true);
      refreshAuth(); // Refresh auth state to pick up new Spotify cookie
      // Clean the URL so it doesn't persist on refresh
      navigate('/profile', { replace: true });
    }
  }, [location.search, navigate, refreshAuth]);

  // Load Friends
  useEffect(() => {
    if (!user?.id) return;
    setLoadingFriends(true);
    socialApi.getFriends(user.id)
      .then(res => setFriends(res.data))
      .catch(() => setFriends([]))
      .finally(() => setLoadingFriends(false));
  }, [user?.id]);

  // Load Letterboxd movies
  useEffect(() => {
    if (!user?.letterboxd_username) return;
    setLoadingLB(true);
    movieApi.getLetterboxd(user.letterboxd_username)
      .then(res => {
        const movies = res.data || [];
        setLbMovies(movies);
        
        // Count movies this month
        const now = new Date();
        const thisMonth = now.toISOString().slice(0, 7);
        
        const moviesThisMonth = movies.filter(movie => {
          const watchedDate = movie.watched_date || movie.date_watched || movie.watchDate;
          if (!watchedDate) return false;
          return watchedDate.startsWith(thisMonth);
        });
        
        setLetterboxdThisMonth(moviesThisMonth.length);
      })
      .catch(() => setLbMovies([]))
      .finally(() => setLoadingLB(false));
  }, [user?.letterboxd_username]);

  // Load Spotify recently played
  useEffect(() => {
    if (!spotifyConnected) return;
    setLoadingSpotify(true);
    spotifyApi.getRecentlyPlayed(50)
      .then(res => {
        if (res.data?.items) {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          
          const songsToday = res.data.items.filter(item => {
            const playedAt = item.played_at?.split('T')[0];
            return playedAt === todayStr;
          });
          
          setSpotifyTodayCount(songsToday.length);
          
          setRecentSongs(res.data.items.slice(0, 20).map(item => ({
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists[0].name,
            artwork: item.track.album.images[0]?.url,
            previewUrl: item.track.preview_url,
            spotifyUrl: item.track.external_urls.spotify,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSpotify(false));
  }, [spotifyConnected]);

  // Real-time polling for Currently Playing - only on first load
  useEffect(() => {
    if (!spotifyConnected) return;

    const fetchCurrent = async () => {
      try {
        const res = await spotifyApi.getCurrentlyPlaying();
        if (res.data && res.data.is_playing) {
          setCurrentlyPlaying({
            name: res.data.item.name,
            artist: res.data.item.artists[0].name,
            artwork: res.data.item.album.images[0]?.url,
            is_playing: true
          });
        } else {
          setCurrentlyPlaying(null);
        }
      } catch (err) {
        console.warn("Error fetching currently playing:", err);
      }
    };

    // Solo fetch al cargar, sin polling constante
    fetchCurrent();
  }, [spotifyConnected]);

  // Load My Lists & Favorites
  useEffect(() => {
    if (!user?.id) return;

    // Fetch lists
    setLoadingLists(true);
    listsApi.getAll(user.id)
      .then(res => setMyLists(res.data || []))
      .catch(() => setMyLists([]))
      .finally(() => setLoadingLists(false));

    // Fetch favorites
    setLoadingFavs(true);
    favoritesApi.getAll(user.id)
      .then(res => {
        console.log('Favorites loaded:', res.data);
        setMyFavorites(res.data || []);
      })
      .catch(err => {
        console.error('Error loading favorites:', err);
        setMyFavorites([]);
      })
      .finally(() => setLoadingFavs(false));
  }, [user?.id]);

  const handleSaveFavorite = async (data) => {
    console.log('Saving favorite:', data);
    try {
      const res = await favoritesApi.save(data);
      console.log('Saved favorite response:', res.data);
      // Update local state - add the new favorite to existing ones
      setMyFavorites(prev => {
        // Remove any existing favorite in same slot (same type and position)
        const filtered = prev.filter(f => !(f.type === data.type && f.position === data.position));
        // Add new favorite
        const updated = [...filtered, res.data];
        console.log('Updated favorites:', updated);
        return updated;
      });
      return true; // Signal success
    } catch (err) {
      console.error("Save favorite error:", err);
      alert('Error al guardar favorito: ' + (err.response?.data?.message || err.message));
      return false;
    }
  };

  const handleRemoveFavorite = async (e, id) => {
    e.stopPropagation();
    try {
      await favoritesApi.remove(id);
      setMyFavorites(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  const getFavoriteAt = (type, pos) => {
    return myFavorites.find(f => f.type === type && f.position === pos);
  };

  const FavoriteSlot = ({ type, position }) => {
    const fav = getFavoriteAt(type, position);
    const isPerson = type === 'actor_fav' || type === 'director_fav';
    const isMedia = type === 'movie_fav' || type === 'song_fav' || type === 'album_fav';
    
    if (fav) {
      return (
        <div className={`fav-slot-item ${isPerson ? 'person' : ''} ${isMedia ? 'media' : ''}`} onClick={() => setActiveSlot({ type, position })}>
          <img src={fav.image_url || 'https://placehold.co/80/1a1a1a/ffffff?text=?'} alt="" className="fav-slot-img" />
          <button className="remove-fav-btn" onClick={(e) => handleRemoveFavorite(e, fav.id)}>
            <X size={10} />
          </button>
        </div>
      );
    }

    return (
      <div className={`fav-slot-item empty ${isPerson ? 'person' : ''} ${isMedia ? 'media' : ''}`} onClick={() => setActiveSlot({ type, position })}>
        <Plus size={16} />
      </div>
    );
  };

  const GustoSection = ({ title, type, icon: IconComponent }) => {
    return (
      <div className="gusto-category">
        <h3 className="gusto-category-title">
          <IconComponent size={14} /> <span>{title}</span>
        </h3>
        <div className="gusto-row">
          {[1, 2, 3, 4].map(pos => <FavoriteSlot key={`${type}-${pos}`} type={type} position={pos} />)}
        </div>
      </div>
    );
  };

  const handleSaveLetterboxd = async (username) => {
    await connectLetterboxd(username);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };


  const avatar = user?.avatar || user?.image;
  const letterboxdConnected = !!user?.letterboxd_username;

  const connections = [
    {
      id: 'spotify',
      name: 'Spotify',
      connected: spotifyConnected,
      icon: <Music size={16} />,
      onClick: spotifyConnected ? null : connectSpotify,
    },
    {
      id: 'letterboxd',
      name: 'Letterboxd',
      connected: letterboxdConnected,
      icon: <Film size={16} />,
      onClick: () => setShowLBModal(true),
    },
  ];

  return (
    <div className="view-container profile-view">
      {/* Header with logout button */}
      <div className="profile-top-bar">
        <h2 className="profile-title-mobile">Mi Perfil</h2>
        <button className="profile-logout-btn" onClick={handleLogout} title={t('auth.logout') || 'Cerrar Sesión'}>
          <LogOut size={18} />
        </button>
      </div>

      {/* ── Profile header ── */}
      <div className="profile-header">
        {/* Avatar */}
        <div className="profile-avatar-wrapper">
          {avatar ? (
            <img src={avatar} alt={user?.name} className="profile-avatar-large" />
          ) : (
            <div className="profile-avatar-large profile-avatar-placeholder">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="profile-info-main">
          <h2 className="profile-name-large">{user?.name}</h2>

          {/* Stats con counts dinámicos */}
          <div className="profile-stats">
            <div className="stat-item highlight">
              <Flame size={14} className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">{spotifyTodayCount}</span>
                <span className="stat-label">hoy</span>
              </div>
            </div>
            <div className="stat-item highlight">
              <Film size={14} className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">{letterboxdThisMonth}</span>
                <span className="stat-label">mes</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-value">{friends.length || 0}</span>
              <span className="stat-label">Amigos</span>
            </div>
          </div>

          {/* Connections */}
          <div className="connections-grid">
            {connections.map(conn => (
              <div
                key={conn.id}
                className={`connection-badge ${conn.connected ? 'connected' : 'disconnected'}`}
                onClick={conn.onClick || undefined}
                style={{ cursor: conn.onClick ? 'pointer' : 'default' }}
                title={conn.connected ? `${conn.name} conectado` : `Conectar ${conn.name}`}
              >
                {conn.icon}
                {conn.connected
                  ? <Check size={12} />
                  : <Plus size={12} />}
              </div>
            ))}
          </div>

          {/* Spotify just connected badge */}
          {spotifyJustConnected && (
            <div className="success-banner">
              <Check size={16} /> {t('profile.spotifySuccess')}
            </div>
          )}
        </div>
      </div>

      {/* Now Playing - visible when something is playing */}
      {currentlyPlaying && (
        <div className="now-playing-bar" style={{ animation: 'none' }}>
          <Music size={16} className="np-icon" />
          <div className="np-track-info">
            <span className="np-track-name">{currentlyPlaying.name}</span>
            <span className="np-artist-name">{currentlyPlaying.artist}</span>
          </div>
        </div>
      )}

      {/* ── Gustos (Favorites) ── */}
      <section className="feed-section">
        <h2 className="section-title">{t('profile.myTastes')}</h2>
        <div className="gustos-container">
          <GustoSection title={t('profile.movies')} type="movie_fav" icon={Film} />
          <GustoSection title={t('profile.songs')} type="song_fav" icon={Music} />
          <GustoSection title={t('profile.albums')} type="album_fav" icon={Radio} />
          <GustoSection title={t('profile.artists')} type="artist_fav" icon={Music} />
          <GustoSection title={t('profile.actors')} type="actor_fav" icon={Star} />
          <GustoSection title={t('profile.directors')} type="director_fav" icon={Circle} />
          
          {!loadingFavs && myFavorites.length === 0 && (
            <p className="text-muted small">{t('profile.noTastes')}</p>
          )}
        </div>
      </section>

      {/* ── Friends Section ── */}
      <section className="feed-section">
        <h2 className="section-title">{t('profile.friends')} ({friends.length})</h2>
        {friends.length > 0 ? (
          <HorizontalScroll>
            {friends.map(friend => (
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
          <p className="text-muted small">{t('profile.noFriendsInvite')}</p>
        )}
      </section>

      {/* ── My Lists ── */}
      <section className="feed-section">
        <h2 className="section-title">{t('profile.myLists')}</h2>
        <HorizontalScroll>
          <div
            className="activity-card"
            style={{ flex: '0 0 160px', height: '100px', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => navigate('/lists')}
          >
            <PlusCircle size={24} style={{ marginBottom: '0.5rem' }} />
            <span className="stat-label" style={{ fontSize: '0.65rem' }}>{t('profile.newList')}</span>
          </div>
          {myLists.map(list => (
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
              <div className="text-muted small">{list.items?.length || 0} elementos</div>
            </div>
          ))}
        </HorizontalScroll>
      </section>

      {/* ── External Integrations ── */}
      <div className="integrations-row">
        
        {/* ── My Music (Spotify) ── */}
        <section className="feed-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>{t('profile.myMusic')}</h2>
            {spotifyConnected && (
              <button
                onClick={() => {
                  setLoadingSpotify(true);
                  spotifyApi.getRecentlyPlayed(20)
                    .then(res => {
                      const data = res.data;
                      if (data?.items) {
                        setRecentSongs(data.items.map(item => ({
                          id: item.track.id,
                          name: item.track.name,
                          artist: item.track.artists[0].name,
                          artwork: item.track.album.images[0]?.url,
                          previewUrl: item.track.preview_url,
                          spotifyUrl: item.track.external_urls.spotify,
                        })));
                      }
                    })
                    .catch(() => {})
                    .finally(() => setLoadingSpotify(false));
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                title="Actualizar"
              >
                <RefreshCw size={16} />
              </button>
            )}
          </div>

          {!spotifyConnected ? (
            <div className="connect-cta-card">
              <Music size={28} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
              <p className="connect-cta-text">{t('profile.connectSpotifyCTA')}</p>
              <button className="rec-button" style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }} onClick={connectSpotify}>
                {t('profile.connectBtn')} Spotify
              </button>
            </div>
          ) : loadingSpotify ? (
            <div className="loading-inline"><LoadingDots className="mini-loader" /> {t('profile.loadingMusic')}</div>
          ) : (
            <HorizontalScroll>
              {recentSongs.map((song, idx) => (
                <div key={`${song.id}-${idx}`} className="song-card" style={{ flex: '0 0 120px' }}>
                  <img src={song.artwork} className="song-artwork" alt={song.name} style={{ width: '120px', height: '120px' }} />
                  <div className="song-name" style={{ fontSize: '0.75rem' }}>{song.name}</div>
                </div>
              ))}
            </HorizontalScroll>
          )}
        </section>

        {/* ── My Movies (Letterboxd) ── */}
        <section className="feed-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>{t('profile.recentViews')}</h2>
          </div>

          {!letterboxdConnected ? (
            <div className="connect-cta-card">
              <Film size={28} style={{ opacity: 0.4, marginBottom: '0.75rem' }} />
              <p className="connect-cta-text">{t('profile.connectLetterboxdCTA')}</p>
              <button className="rec-button" style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }} onClick={() => setShowLBModal(true)}>
                {t('profile.connectBtn')} Letterboxd
              </button>
            </div>
          ) : loadingLB ? (
            <div className="loading-inline"><LoadingDots className="mini-loader" /> {t('profile.loadingMovies')}</div>
          ) : (
            <HorizontalScroll>
              {lbMovies.map((movie, idx) => (
                <div key={`${movie.id}-${idx}`} className="movie-card" style={{ flex: '0 0 100px' }}>
                  <img src={movie.poster} className="movie-artwork" alt={movie.title} style={{ width: '100px', height: '150px' }} />
                  <div className="movie-name" style={{ fontSize: '0.75rem' }}>{movie.title}</div>
                </div>
              ))}
            </HorizontalScroll>
          )}
        </section>

      </div>

      {/* ── Modals ── */}
      {showLBModal && (
        <LetterboxdModal
          onClose={() => setShowLBModal(false)}
          onSave={handleSaveLetterboxd}
          currentUsername={user?.letterboxd_username}
        />
      )}

      {activeSlot && (
        <FavoriteSearchModal
          type={activeSlot.type}
          position={activeSlot.position}
          userId={user.id}
          onClose={() => setActiveSlot(null)}
          onSave={handleSaveFavorite}
        />
      )}
    </div>
  );
};

export default Profile;

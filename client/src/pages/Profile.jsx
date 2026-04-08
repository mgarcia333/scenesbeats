import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socialApi, spotifyApi, movieApi, favoritesApi, listsApi } from '../api';
import {
  Music, Film, Star, PlusCircle, Circle, Check, Plus,
  X, Loader2, ExternalLink, RefreshCw, LogOut, Radio, List as ListIcon,
  Search, Trash2
} from 'lucide-react';
import HorizontalScroll from '../components/HorizontalScroll';

/* ─────────────────────────────────────────────
   Favorite Search Modal
───────────────────────────────────────────── */
const FavoriteSearchModal = ({ type, position, onClose, onSave, userId }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (val) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }
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
    } finally {
      setLoading(false);
    }
  };

  const selectItem = async (item) => {
    setLoading(true);
    try {
      await onSave({
        user_id: userId,
        type,
        position,
        external_id: String(item.id),
        title: item.title,
        subtitle: item.subtitle,
        image_url: item.image
      });
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card favorite-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Buscar Favorito</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="search-box-wrapper" style={{ margin: '1rem 0' }}>
          <Search size={18} className="search-icon-inside" />
          <input
            ref={inputRef}
            type="text"
            className="modal-input search-input-clean"
            placeholder="Escribe para buscar..."
            value={query}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>

        <div className="search-results-mini">
          {loading && <div className="loading-inline"><Loader2 size={20} className="spin" /> Buscando...</div>}
          {!loading && results.map(item => (
            <div key={item.id} className="search-result-row" onClick={() => selectItem(item)}>
              <img src={item.image || 'https://placehold.co/40/1a1a1a/ffffff?text=?'} alt="" className="result-mini-img" />
              <div className="result-mini-info">
                <div className="result-mini-title">{item.title}</div>
                <div className="result-mini-subtitle">{item.subtitle}</div>
              </div>
              <Plus size={16} className="add-icon" />
            </div>
          ))}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="text-muted small" style={{ textAlign: 'center', padding: '1rem' }}>No se encontraron resultados.</p>
          )}
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
            {loading ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
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
  const { user, logout, spotifyConnected, connectLetterboxd, connectSpotify, refreshAuth } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [lbMovies, setLbMovies] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);
  const [recentSongs, setRecentSongs] = useState([]);
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [showLBModal, setShowLBModal] = useState(false);
  const [spotifyJustConnected, setSpotifyJustConnected] = useState(false);

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
      .then(res => setLbMovies(res.data))
      .catch(() => setLbMovies([]))
      .finally(() => setLoadingLB(false));
  }, [user?.letterboxd_username]);

  // Load Spotify recently played
  useEffect(() => {
    if (!spotifyConnected) return;
    setLoadingSpotify(true);
    spotifyApi.getRecentlyPlayed(20)
      .then(res => {
        if (res.data?.items) {
          setRecentSongs(res.data.items.map(item => ({
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

  // Real-time polling for Currently Playing
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
        if (err.response?.status === 401) {
          console.warn("Spotify session expired (401). Stopping poll.");
          setSpotifyConnected(false);
        } else {
          console.warn("Error polling Spotify:", err);
        }
      }
    };

    fetchCurrent();
    const interval = setInterval(fetchCurrent, 15000); // 15s polling
    return () => clearInterval(interval);
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
      .then(res => setMyFavorites(res.data || []))
      .catch(() => setMyFavorites([]))
      .finally(() => setLoadingFavs(false));
  }, [user?.id]);

  const handleSaveFavorite = async (data) => {
    const res = await favoritesApi.save(data);
    // Update local state
    setMyFavorites(prev => {
      const filtered = prev.filter(f => !(f.type === data.type && f.position === data.position));
      return [...filtered, res.data];
    });
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
    
    if (fav) {
      return (
        <div className="fav-mini-card occupied" onClick={() => setActiveSlot({ type, position })}>
          <img src={fav.image_url || 'https://placehold.co/80/1a1a1a/ffffff?text=?'} alt="" className="fav-mini-img" />
          <div className="fav-mini-info">
            <div className="fav-mini-title">{fav.title}</div>
            {fav.subtitle && <div className="fav-mini-subtitle">{fav.subtitle}</div>}
          </div>
          <button className="remove-fav-btn" onClick={(e) => handleRemoveFavorite(e, fav.id)}>
            <X size={12} />
          </button>
        </div>
      );
    }

    return (
      <div className="fav-mini-card empty-slot" onClick={() => setActiveSlot({ type, position })}>
        <div className="empty-slot-content">
          <Plus size={18} />
        </div>
      </div>
    );
  };

  const GustoSection = ({ title, type, icon: IconComponent }) => {
    return (
      <div className="gusto-category">
        <h3 className="gusto-category-title">
          <IconComponent size={14} /> <span>{title}</span>
        </h3>
        <div className="gusto-grid">
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
    <div className="view-container">
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

          {/* Now Playing Widget */}
          {currentlyPlaying && (
            <div className="now-playing-badge animate-fadeIn">
              <div className="np-pulse">
                <Radio size={12} />
              </div>
              <div className="np-info">
                <span className="np-label">Listening now</span>
                <span className="np-track">{currentlyPlaying.name}</span>
              </div>
            </div>
          )}

          <button className="profile-logout-fab" onClick={handleLogout} title={t('auth.logout') || 'Cerrar Sesión'}>
            <LogOut size={18} />
          </button>
        </div>

        {/* Info */}
        <div className="profile-info-main">
          <h2 className="profile-name-large">{user?.name}</h2>
          <p className="hero-subtitle" style={{ marginBottom: '0.5rem' }}>{user?.email}</p>

          {/* Stats */}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{lbMovies.length || 0}</span>
              <span className="stat-label">{t('profile.movies')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{recentSongs.length || 0}</span>
              <span className="stat-label">{t('profile.songs')}</span>
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
                <span className={`icon-${conn.id}`}>{conn.icon}</span>
                {conn.name}
                {conn.connected
                  ? <Check size={13} style={{ marginLeft: '4px', color: 'var(--primary-color)' }} />
                  : <Plus size={13} style={{ marginLeft: '4px', opacity: 0.6 }} />}
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

      {/* ── Gustos (Favorites) ── */}
      <section className="feed-section" style={{ marginTop: '2rem' }}>
        <h2 className="section-title">Mis Gustos</h2>
        <div className="gustos-container">
          <GustoSection title="Películas" type="movie_fav" icon={Film} />
          <GustoSection title="Actores" type="actor_fav" icon={Star} />
          <GustoSection title="Directores" type="director_fav" icon={Circle} />
          <GustoSection title="Canciones" type="song_fav" icon={Music} />
          <GustoSection title="Álbumes" type="album_fav" icon={Radio} />
          <GustoSection title="Artistas" type="artist_fav" icon={Music} />
          
          {!loadingFavs && myFavorites.length === 0 && (
            <p className="text-muted small">Aún no has añadido tus gustos favoritos.</p>
          )}
        </div>
      </section>

      {/* ── Friends Section ── */}
      <section className="feed-section" style={{ marginTop: '2.5rem' }}>
        <h2 className="section-title">Amigos ({friends.length})</h2>
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
          <p className="text-muted small">Aún no tienes amigos. ¡Busca usuarios en la pestaña de Buscar!</p>
        )}
      </section>

      {/* ── My Lists ── */}
      <section className="feed-section" style={{ marginTop: '2.5rem' }}>
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
      <div className="integrations-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
        
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
            <div className="loading-inline"><Loader2 size={20} className="spin" /> {t('profile.loadingMusic')}</div>
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
            <div className="loading-inline"><Loader2 size={20} className="spin" /> {t('profile.loadingMovies')}</div>
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

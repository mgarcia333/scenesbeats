import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Music, Film, Star, PlusCircle, Circle, Check, Plus,
  X, Loader2, ExternalLink, RefreshCw, LogOut
} from 'lucide-react';

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

  const [lbMovies, setLbMovies] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);
  const [recentSongs, setRecentSongs] = useState([]);
  const [loadingSpotify, setLoadingSpotify] = useState(false);
  const [showLBModal, setShowLBModal] = useState(false);
  const [spotifyJustConnected, setSpotifyJustConnected] = useState(false);

  // Drag-scroll state
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  // Load Letterboxd movies
  useEffect(() => {
    if (!user?.letterboxd_username) return;
    setLoadingLB(true);
    fetch(`/api/movie/letterboxd/${user.letterboxd_username}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setLbMovies(data))
      .catch(() => setLbMovies([]))
      .finally(() => setLoadingLB(false));
  }, [user?.letterboxd_username]);

  // Load Spotify recently played
  useEffect(() => {
    if (!spotifyConnected) return;
    setLoadingSpotify(true);
    fetch('/api/spotify/recently-played?limit=20', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
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
  }, [spotifyConnected]);

  const handleSaveLetterboxd = async (username) => {
    await connectLetterboxd(username);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Drag-scroll handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = scrollLeft - (x - startX) * 2;
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

      {/* ── My Lists ── */}
      <section className="feed-section">
        <h2 className="section-title">{t('profile.myLists')}</h2>
        <div className="horizontal-scroll">
          <div
            className="activity-card"
            style={{ flex: '0 0 160px', height: '100px', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
          >
            <PlusCircle size={24} style={{ marginBottom: '0.5rem' }} />
            <span className="stat-label" style={{ fontSize: '0.65rem' }}>{t('profile.newList')}</span>
          </div>
          <div
            className="activity-card"
            style={{ flex: '0 0 160px', height: '100px', justifyContent: 'center', alignItems: 'center' }}
          >
            <Circle size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <span className="stat-label" style={{ fontSize: '0.65rem' }}>Vibra Nocturna</span>
          </div>
        </div>
      </section>

      {/* ── My Music (Spotify) ── */}
      <section className="feed-section" style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>{t('profile.myMusic')}</h2>
          {spotifyConnected && (
            <button
              onClick={() => {
                setLoadingSpotify(true);
                fetch('/api/spotify/recently-played?limit=20', { credentials: 'include' })
                  .then(r => r.ok ? r.json() : null)
                  .then(data => {
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
        ) : recentSongs.length > 0 ? (
          <div className="horizontal-scroll">
            {recentSongs.map((song, idx) => (
              <div key={`${song.id}-${idx}`} className="song-card">
                <img src={song.artwork} className="song-artwork" alt={song.name} />
                <div className="song-name" title={song.name}>{song.name}</div>
                <div className="song-artist">{song.artist}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stat-label" style={{ padding: '2rem', opacity: 0.5 }}>
            {t('profile.noRecentSongs')}
          </div>
        )}
      </section>

      {/* ── My Movies (Letterboxd) ── */}
      <section className="feed-section" style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>{t('profile.recentViews')}</h2>
          <button
            onClick={() => setShowLBModal(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Film size={14} />
            {letterboxdConnected ? t('profile.changeUser') : t('profile.connectLB')}
          </button>
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
        ) : lbMovies.length > 0 ? (
          <div
            className={`horizontal-scroll ${isDragging ? 'dragging' : ''}`}
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {lbMovies.map((movie, idx) => (
              <div key={`${movie.id}-${idx}`} className="movie-card">
                <a
                  href={movie.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
                >
                  <img src={movie.poster} className="movie-artwork" alt={movie.title} />
                </a>
                <div className="movie-name" title={movie.title}>{movie.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="movie-year">{movie.year}</div>
                  {renderStars(movie.rating)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stat-label" style={{ padding: '2rem', opacity: 0.5 }}>
            {t('profile.noMoviesFound')} <strong>@{user?.letterboxd_username}</strong>.{' '}
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowLBModal(true)}>
              {t('profile.changeUser')}
            </span>
          </div>
        )}
      </section>

      {/* ── Letterboxd modal ── */}
      {showLBModal && (
        <LetterboxdModal
          onClose={() => setShowLBModal(false)}
          onSave={handleSaveLetterboxd}
          currentUsername={user?.letterboxd_username}
        />
      )}
    </div>
  );
};

export default Profile;

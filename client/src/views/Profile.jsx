import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music, Clapperboard, Film, PlusCircle, Circle, Check, Plus, Trash2, Settings } from 'lucide-react';
import { MovieCard } from '../components/Cards';
import HorizontalScroll from '../components/HorizontalScroll';
import LoadingScreen from '../components/LoadingScreen';
import SearchModal from '../components/SearchModal';
import { authApi, favoritesApi, movieApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Profile = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lbUsername, setLbUsername] = useState(localStorage.getItem('lb_username') || '');
  const [lbMovies, setLbMovies] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);
  
  // Favorites State
  const [favMovies, setFavMovies] = useState([]);
  const [favSongs, setFavSongs] = useState([]);
  const [favAlbums, setFavAlbums] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Search Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('movie'); // 'movie', 'song', 'album'

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchFavorites = async (userId) => {
    if (!userId) return;
    setLoadingFavs(true);
    try {
      const res = await favoritesApi.getAll(userId);
      const favs = res.data;
      setFavMovies(favs.filter(f => f.type === 'movie'));
      setFavSongs(favs.filter(f => f.type === 'song'));
      setFavAlbums(favs.filter(f => f.type === 'album'));
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoadingFavs(false);
    }
  };

  const fetchLetterboxd = async (username) => {
    if (!username) return;
    setLoadingLB(true);
    try {
      const res = await movieApi.getLetterboxd(username);
      const data = res.data;
      setLbMovies(data);
      // Removed illegal setUser call as user is now global from AuthContext
    } catch (err) {
      console.error("Error fetching Letterboxd:", err);
    } finally {
      setLoadingLB(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchFavorites(user.id);
        if (lbUsername) {
            fetchLetterboxd(lbUsername);
        }
    }
  }, [user]);

  const handleConnectLB = () => {
    const username = prompt("Introduce tu usuario de Letterboxd:", lbUsername);
    if (username !== null) {
      setLbUsername(username);
      localStorage.setItem('lb_username', username);
      fetchLetterboxd(username);
    }
  };

  const openSearch = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleSelectFav = async (item) => {
    if (!user) return;
    
    const payload = {
      user_id: user.id,
      type: modalType,
      external_id: String(item.id),
      title: item.title || item.name,
      subtitle: item.year || item.artist || '',
      image_url: item.poster || item.artwork
    };

    try {
      const res = await favoritesApi.save(payload);
      if (modalType === 'movie') {
        setFavMovies([...favMovies, res.data]);
      } else if (modalType === 'song') {
        setFavSongs([...favSongs, res.data]);
      } else if (modalType === 'album') {
        setFavAlbums([...favAlbums, res.data]);
      }
    } catch (err) {
      console.error("Error saving favorite:", err);
    }
    setModalOpen(false);
  };

  const handleRemoveFav = async (type, id) => {
    try {
      await favoritesApi.remove(id);
      if (type === 'movie') {
        setFavMovies(favMovies.filter(m => m.id !== id));
      } else if (type === 'song') {
        setFavSongs(favSongs.filter(s => s.id !== id));
      } else if (type === 'album') {
        setFavAlbums(favAlbums.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  };

  const renderFavSection = (title, items, type) => (
    <section className="feed-section" style={{ marginTop: '2.5rem' }}>
      <h2 className="section-title">{title}</h2>
      <div className="favorites-grid">
        {items.map((item) => (
          <div key={item.id} className="fav-item-card" onClick={() => handleRemoveFav(type, item.id)}>
            <img src={item.poster || item.artwork} alt={item.name || item.title} className="fav-item-img" />
            <div className="dot-badge"><Plus size={12} style={{ transform: 'rotate(45deg)' }} /></div>
          </div>
        ))}
        {items.length < 5 && [...Array(5 - items.length)].map((_, i) => (
          <div key={`empty-${type}-${i}`} className="fav-slot" onClick={() => openSearch(type)}>
            <Plus size={24} />
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="view-container">
      {!user ? (
        <LoadingScreen message="Cargando perfil..." />
      ) : (
        <>
          <div className="profile-header glass" style={{ position: 'relative', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: '2.5rem' }}>
            <button 
                onClick={handleLogout} 
                style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.2)', color: '#ff3b30', padding: '0.6rem', borderRadius: '12px', cursor: 'pointer' }}
                title="Cerrar sesión"
            >
                <LogOut size={20} />
            </button>
            <img src={user.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} alt={user.name} className="profile-avatar-large" style={{ border: '4px solid var(--primary-color)', boxShadow: '0 0 20px rgba(0,122,255,0.3)' }} />
            <div className="profile-info-main">
              <h2 className="profile-name-large" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{user.name}</h2>
              <p className="hero-subtitle" style={{ fontSize: '1.1rem', opacity: 0.8, color: 'var(--accent-blue)' }}>{user.email}</p>
              
              <div className="profile-stats" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="stat-item">
                  <span className="stat-label" style={{ letterSpacing: '0.1em' }}>{t('profile.movies')}</span>
                  <span className="stat-value" style={{ fontSize: '1.4rem' }}>{user.stats?.movies || 0}</span>
                </div>
                <div className="stat-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                  <span className="stat-label" style={{ letterSpacing: '0.1em' }}>{t('profile.songs')}</span>
                  <span className="stat-value" style={{ fontSize: '1.4rem' }}>{user.stats?.songs || 0}</span>
                </div>
                <div className="stat-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
                  <span className="stat-label" style={{ letterSpacing: '0.1em' }}>{t('profile.friends')}</span>
                  <span className="stat-value" style={{ fontSize: '1.4rem' }}>{user.stats?.friends || 0}</span>
                </div>
              </div>

              <div className="connections-grid" style={{ marginTop: '1.5rem' }}>
                {(user.connections || [
                    { id: 'spotify', name: 'Spotify', connected: !!user.spotify_id, icon: <Music size={16} /> },
                    { id: 'tmdb', name: 'TMDB', connected: true, icon: <Clapperboard size={16} /> },
                    { id: 'letterboxd', name: 'Letterboxd', connected: !!localStorage.getItem('lb_username'), icon: <Film size={16} /> }
                ]).map(conn => (
                  <div 
                    key={conn.id} 
                    className={`connection-badge ${conn.connected ? 'connected' : 'disconnected'}`}
                    onClick={conn.id === 'letterboxd' ? handleConnectLB : undefined}
                    style={{ 
                      cursor: conn.id === 'letterboxd' ? 'pointer' : 'default',
                      background: conn.connected ? 'rgba(0,122,255,0.15)' : 'rgba(255,255,255,0.05)',
                      border: conn.connected ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '100px'
                    }}
                  >
                    <span className={`icon-${conn.id}`} style={{ marginRight: '6px' }}>{conn.icon}</span>
                    <span style={{ fontWeight: '700' }}>{conn.name}</span>
                    {conn.connected ? <Check size={14} style={{ marginLeft: '6px', color: 'var(--accent-green)' }} /> : <Plus size={14} style={{ marginLeft: '6px' }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {renderFavSection("Mis 5 Películas Favoritas", favMovies, 'movie')}
          {renderFavSection("Mis 5 Canciones Favoritas", favSongs, 'song')}
          {renderFavSection("Mis 5 Álbumes Favoritos", favAlbums, 'album')}

          <section className="feed-section" style={{ marginTop: '2.5rem' }}>
            <h2 className="section-title">{t('profile.myLists')}</h2>
            <HorizontalScroll>
              <div className="activity-card glass" style={{ flex: '0 0 140px', height: '100px', justifyContent: 'center', alignItems: 'center', borderRadius: '12px' }}>
                <PlusCircle size={20} style={{ marginBottom: '0.4rem', color: 'var(--primary-color)' }} />
                <span className="stat-label" style={{ fontSize: '0.6rem' }}>{t('profile.newList')}</span>
              </div>
              <div className="activity-card glass" style={{ flex: '0 0 140px', height: '100px', justifyContent: 'center', alignItems: 'center', borderRadius: '12px' }}>
                <Circle size={20} style={{ marginBottom: '0.4rem', opacity: 0.3 }} />
                <span className="stat-label" style={{ fontSize: '0.6rem' }}>Vibra Nocturna</span>
              </div>
            </HorizontalScroll>
          </section>

          <section className="feed-section" style={{ marginTop: '2.5rem' }}>
            <h2 className="section-title">{t('profile.recentViews')}</h2>
            <HorizontalScroll>
              {loadingLB ? (
                <div style={{ padding: '2rem' }}>
                  <LoadingScreen message="Cargando películas reales..." />
                </div>
              ) : lbMovies.length > 0 ? (
                lbMovies.map((movie, idx) => (
                  <MovieCard key={`profile-movie-${movie.id || idx}-${idx}`} movie={movie} />
                ))
              ) : (
                <div className="stat-label" style={{ padding: '2rem', opacity: 0.5 }}>
                  {lbUsername ? "No se encontraron películas." : "Conecta tu Letterboxd para ver tus películas."}
                </div>
              )}
            </HorizontalScroll>
          </section>
        </>
      )}

      <SearchModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSelect={handleSelectFav} 
        type={modalType}
        title={modalType === 'movie' ? 'Películas' : modalType === 'song' ? 'Canciones' : 'Álbumes'}
      />
    </div>
  );
};


export default Profile;





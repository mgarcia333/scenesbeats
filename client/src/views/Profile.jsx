import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Clapperboard, Film, PlusCircle, Circle, Check, Plus, Trash2 } from 'lucide-react';
import { MovieCard } from '../components/Cards';
import HorizontalScroll from '../components/HorizontalScroll';
import LoadingScreen from '../components/LoadingScreen';
import SearchModal from '../components/SearchModal';

const Profile = () => {
  const { t } = useTranslation();
  const [lbUsername, setLbUsername] = useState(localStorage.getItem('lb_username') || '');
  const [lbMovies, setLbMovies] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);
  
  // Favorites State
  const [favMovies, setFavMovies] = useState(JSON.parse(localStorage.getItem('fav_movies') || '[]'));
  const [favSongs, setFavSongs] = useState(JSON.parse(localStorage.getItem('fav_songs') || '[]'));
  const [favAlbums, setFavAlbums] = useState(JSON.parse(localStorage.getItem('fav_albums') || '[]'));

  // Search Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('movie'); // 'movie', 'song', 'album'

  const [user, setUser] = useState({
    name: "Moisés García",
    username: "mgarcia333",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Moises",
    stats: {
      movies: 0,
      songs: 3450,
      friends: 42
    },
    connections: [
      { id: 'spotify', name: 'Spotify', connected: true, icon: <Music size={16} /> },
      { id: 'tmdb', name: 'TMDB', connected: true, icon: <Clapperboard size={16} /> },
      { id: 'letterboxd', name: 'Letterboxd', connected: !!localStorage.getItem('lb_username'), icon: <Film size={16} /> }
    ]
  });

  const fetchLetterboxd = async (username) => {
    if (!username) return;
    setLoadingLB(true);
    try {
      const res = await fetch(`/api/movie/letterboxd/${username}`);
      if (res.ok) {
        const data = await res.json();
        setLbMovies(data);
        setUser(prev => ({
          ...prev,
          stats: { ...prev.stats, movies: data.length },
          connections: prev.connections.map(c => 
            c.id === 'letterboxd' ? { ...c, connected: true } : c
          )
        }));
      }
    } catch (err) {
      console.error("Error fetching Letterboxd:", err);
    } finally {
      setLoadingLB(false);
    }
  };

  useEffect(() => {
    if (lbUsername) {
      fetchLetterboxd(lbUsername);
    }
  }, []);

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

  const handleSelectFav = (item) => {
    let newState = [];
    if (modalType === 'movie') {
      if (favMovies.length >= 5) return;
      newState = [...favMovies, item];
      setFavMovies(newState);
      localStorage.setItem('fav_movies', JSON.stringify(newState));
    } else if (modalType === 'song') {
      if (favSongs.length >= 5) return;
      newState = [...favSongs, item];
      setFavSongs(newState);
      localStorage.setItem('fav_songs', JSON.stringify(newState));
    } else if (modalType === 'album') {
      if (favAlbums.length >= 5) return;
      newState = [...favAlbums, item];
      setFavAlbums(newState);
      localStorage.setItem('fav_albums', JSON.stringify(newState));
    }
    setModalOpen(false);
  };

  const handleRemoveFav = (type, id) => {
    let newState = [];
    if (type === 'movie') {
      newState = favMovies.filter(m => m.id !== id);
      setFavMovies(newState);
      localStorage.setItem('fav_movies', JSON.stringify(newState));
    } else if (type === 'song') {
      newState = favSongs.filter(s => s.id !== id);
      setFavSongs(newState);
      localStorage.setItem('fav_songs', JSON.stringify(newState));
    } else if (type === 'album') {
      newState = favAlbums.filter(a => a.id !== id);
      setFavAlbums(newState);
      localStorage.setItem('fav_albums', JSON.stringify(newState));
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
      <div className="profile-header glass" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: '2.5rem' }}>
        <img src={user.avatar} alt={user.name} className="profile-avatar-large" style={{ border: '4px solid var(--primary-color)', boxShadow: '0 0 20px rgba(0,122,255,0.3)' }} />
        <div className="profile-info-main">
          <h2 className="profile-name-large" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{user.name}</h2>
          <p className="hero-subtitle" style={{ fontSize: '1.1rem', opacity: 0.8, color: 'var(--accent-blue)' }}>@{user.username}</p>
          
          <div className="profile-stats" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="stat-item">
              <span className="stat-label" style={{ letterSpacing: '0.1em' }}>{t('profile.movies')}</span>
              <span className="stat-value" style={{ fontSize: '1.4rem' }}>{user.stats.movies}</span>
            </div>
            <div className="stat-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
              <span className="stat-label" style={{ letterSpacing: '0.1em' }}>{t('profile.songs')}</span>
              <span className="stat-value" style={{ fontSize: '1.4rem' }}>{user.stats.songs > 999 ? (user.stats.songs/1000).toFixed(1) + 'k' : user.stats.songs}</span>
            </div>
            <div className="stat-item" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem' }}>
              <span className="stat-label" style={{ letterSpacing: '0.1em' }}>{t('profile.friends')}</span>
              <span className="stat-value" style={{ fontSize: '1.4rem' }}>{user.stats.friends}</span>
            </div>
          </div>

          <div className="connections-grid" style={{ marginTop: '1.5rem' }}>
            {user.connections.map(conn => (
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

      <SearchModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSelect={handleSelectFav} 
        type={modalType}
        title={modalType === 'movie' ? 'Películas' : modalType === 'song' ? 'Canciones' : 'Álbumes'}
      />

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
    </div>
  );
};


export default Profile;





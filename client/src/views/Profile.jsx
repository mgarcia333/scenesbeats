import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Music, Clapperboard, Film, Star, PlusCircle, Circle, Check, Plus } from 'lucide-react';

const Profile = () => {
  const { t } = useTranslation();
  const [lbUsername, setLbUsername] = useState(localStorage.getItem('lb_username') || '');
  const [lbMovies, setLbMovies] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);
  
  // Drag to scroll state
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const renderStars = (rating) => {
    if (!rating) return <div className="stars-container" style={{ opacity: 0 }}><Star size={12} /></div>;
    const num = parseFloat(rating);
    const fullStars = Math.floor(num);
    const halfStar = num % 1 !== 0;
    return (
      <div className="stars-container">
        {[...Array(fullStars)].map((_, i) => <Star key={i} size={12} fill="currentColor" style={{ display: 'inline' }} />)}
        {halfStar ? "½" : ""}
      </div>
    );
  };

  return (
    <div className="view-container">
      <div className="profile-header">
        <img src={user.avatar} alt={user.name} className="profile-avatar-large" />
        <div className="profile-info-main">
          <h2 className="profile-name-large">{user.name}</h2>
          <p className="hero-subtitle">@{user.username}</p>
          
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{user.stats.movies}</span>
              <span className="stat-label">{t('profile.movies')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{user.stats.songs}</span>
              <span className="stat-label">{t('profile.songs')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{user.stats.friends}</span>
              <span className="stat-label">{t('profile.friends')}</span>
            </div>
          </div>

          <div className="connections-grid">
            {user.connections.map(conn => (
              <div 
                key={conn.id} 
                className={`connection-badge ${conn.connected ? 'connected' : 'disconnected'}`}
                onClick={conn.id === 'letterboxd' ? handleConnectLB : undefined}
                style={{ cursor: conn.id === 'letterboxd' ? 'pointer' : 'default' }}
              >
                <span className={`icon-${conn.id}`}>{conn.icon}</span>
                {conn.name}
                {conn.connected ? <Check size={14} style={{ marginLeft: '4px' }} /> : <Plus size={14} style={{ marginLeft: '4px' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="feed-section">
        <h2 className="section-title">{t('profile.myLists')}</h2>
        <div className="horizontal-scroll">
          <div className="activity-card" style={{ flex: '0 0 160px', height: '100px', justifyContent: 'center', alignItems: 'center' }}>
            <PlusCircle size={24} style={{ marginBottom: '0.5rem' }} />
            <span className="stat-label" style={{ fontSize: '0.65rem' }}>{t('profile.newList')}</span>
          </div>
          <div className="activity-card" style={{ flex: '0 0 160px', height: '100px', justifyContent: 'center', alignItems: 'center' }}>
            <Circle size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
            <span className="stat-label" style={{ fontSize: '0.65rem' }}>Vibra Nocturna</span>
          </div>
        </div>
      </section>

      <section className="feed-section" style={{ marginTop: '2.5rem' }}>
        <h2 className="section-title">{t('profile.recentViews')}</h2>
        <div 
          className={`horizontal-scroll ${isDragging ? 'dragging' : ''}`}
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {loadingLB ? (
            <div className="stat-label" style={{ padding: '2rem' }}>Cargando películas reales...</div>
          ) : lbMovies.length > 0 ? (
            lbMovies.map(movie => (
              <div key={movie.id} className="movie-card">
                <a href={movie.link} target="_blank" rel="noopener noreferrer" style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
                  <img src={movie.poster} className="movie-artwork" alt={movie.title} />
                </a>
                <div className="movie-name" title={movie.title}>{movie.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="movie-year">{movie.year}</div>
                  {renderStars(movie.rating)}
                </div>
              </div>
            ))
          ) : (
            <div className="stat-label" style={{ padding: '2rem', opacity: 0.5 }}>
              {lbUsername ? "No se encontraron películas." : "Conecta tu Letterboxd para ver tus películas."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;





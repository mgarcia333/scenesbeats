import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Music, Clapperboard, Film, PlusCircle, Circle, Check, Plus, Trash2, Settings } from 'lucide-react';
import { MovieCard } from '../components/Cards';
import HorizontalScroll from '../components/HorizontalScroll';
import LoadingScreen from '../components/LoadingScreen';
import SearchModal from '../components/SearchModal';
import MediaDetailsModal from '../components/MediaDetailsModal';
import AddToListModal from '../components/AddToListModal';
import { authApi, favoritesApi, movieApi, listsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Profile = () => {
  const { t } = useTranslation();
  const { user, loading, logout, updateUser } = useAuth();
  // Search Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('movie'); // 'movie', 'song', 'album'
  
  // Letterboxd State
  const [lbInput, setLbInput] = useState(user?.letterboxd_username || '');
  const [lbMovies, setLbMovies] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);
  const [syncingLB, setSyncingLB] = useState(false);
  const [showLbInput, setShowLbInput] = useState(false);

  // Favorites State
  const [favMovies, setFavMovies] = useState([]);
  const [favSongs, setFavSongs] = useState([]);
  const [favAlbums, setFavAlbums] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);

  // Lists & Modals State
  const [userLists, setUserLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [addToListModalOpen, setAddToListModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSyncLetterboxd = async (e) => {
    if (e) e.preventDefault();
    if (!lbInput) return;
    setSyncingLB(true);
    try {
      const res = await authApi.syncLetterboxd(lbInput, user.email);
      if (res.data.status === 'success') {
        updateUser({ letterboxd_username: lbInput });
        localStorage.setItem('lb_username', lbInput);
        fetchLetterboxd(lbInput);
        setShowLbInput(false);
      }
    } catch (err) {
      console.error("Error syncing Letterboxd:", err);
    } finally {
      setSyncingLB(false);
    }
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
      if (err.response?.status === 404) {
        console.warn(`Letterboxd user "${username}" not found or has no recent activity.`);
      } else {
        console.error("Error fetching Letterboxd:", err);
      }
    } finally {
      setLoadingLB(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchFavorites(user.id);
        fetchUserLists(user.id);
        const lbUser = user.letterboxd_username || localStorage.getItem('lb_username');
        if (lbUser) {
            fetchLetterboxd(lbUser);
            if (!lbInput) setLbInput(lbUser);
        }
    }
  }, [user]);

  const fetchUserLists = async (userId) => {
    setLoadingLists(true);
    try {
      const res = await listsApi.getAll(userId);
      setUserLists(res.data);
    } catch (err) {
      console.error("Error fetching lists", err);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleCardClick = (item, type) => {
    setSelectedItem(item);
    setSelectedType(type || 'movie');
    setDetailsModalOpen(true);
  };

  const handleOpenAddToList = (item, type) => {
    setSelectedItem(item);
    setSelectedType(type || 'movie');
    setDetailsModalOpen(false);
    setAddToListModalOpen(true);
  };

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
                {(user?.connections || [
                    { id: 'spotify', name: 'Spotify', connected: !!user?.spotify_id, icon: <Music size={16} /> },
                    { id: 'tmdb', name: 'TMDB', connected: true, icon: <Clapperboard size={16} /> },
                    { id: 'letterboxd', name: 'Letterboxd', connected: !!user?.letterboxd_username, icon: <Film size={16} /> }
                ]).map(conn => (
                  <div 
                    key={conn.id} 
                    className={`connection-badge ${conn.connected ? 'connected' : 'disconnected'}`}
                    style={{ 
                      background: conn.connected ? 'rgba(0,122,255,0.15)' : 'rgba(255,255,255,0.05)',
                      border: conn.connected ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '100px',
                      cursor: conn.id === 'letterboxd' ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                        if (conn.id === 'letterboxd') {
                            if (!showLbInput && user?.letterboxd_username) {
                                setLbInput(user.letterboxd_username);
                            }
                            setShowLbInput(!showLbInput);
                        }
                    }}
                  >
                    <span className={`icon-${conn.id}`} style={{ marginRight: '6px' }}>{conn.icon}</span>
                    <span style={{ fontWeight: '700' }}>{conn.name}</span>
                    {conn.connected ? <Check size={14} style={{ marginLeft: '6px', color: 'var(--accent-green)' }} /> : (
                        conn.id === 'letterboxd' ? <Plus size={14} style={{ marginLeft: '6px' }} /> : null
                    )}
                  </div>
                ))}
              </div>
              
              {/* Premium Letterboxd Input - Collapsible */}
              {showLbInput && (
                <div className="letterboxd-connect-premium glass" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <Film size={20} color="var(--primary-color)" style={{ marginRight: '10px' }} />
                        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                            {user.letterboxd_username ? 'Cambiar perfil de Letterboxd' : 'Conecta tu Letterboxd'}
                        </h3>
                    </div>
                    <form onSubmit={handleSyncLetterboxd} style={{ display: 'flex', gap: '10px' }}>
                        <div className="input-group-premium glass" style={{ flex: 1, margin: 0, padding: '0.6rem 1rem' }}>
                            <input 
                                type="text" 
                                placeholder="Tu usuario de Letterboxd" 
                                value={lbInput}
                                onChange={(e) => setLbInput(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn-primary-premium" 
                            style={{ padding: '0.6rem 1.5rem', minWidth: 'auto' }}
                            disabled={syncingLB}
                        >
                            {syncingLB ? '...' : 'Conectar'}
                        </button>
                    </form>
                </div>
              )}
            </div>
          </div>

          {renderFavSection("Mis 5 Películas Favoritas", favMovies, 'movie')}
          {renderFavSection("Mis 5 Canciones Favoritas", favSongs, 'song')}
          {renderFavSection("Mis 5 Álbumes Favoritos", favAlbums, 'album')}

          <section className="feed-section" style={{ marginTop: '2.5rem' }}>
            <h2 className="section-title">{t('profile.myLists')}</h2>
            <HorizontalScroll>
              <div 
                className="activity-card glass" 
                onClick={() => handleOpenAddToList(null, null)}
                style={{ flex: '0 0 140px', height: '100px', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', cursor: 'pointer' }}
              >
                <PlusCircle size={20} style={{ marginBottom: '0.4rem', color: 'var(--primary-color)' }} />
                <span className="stat-label" style={{ fontSize: '0.6rem' }}>Crear Lista</span>
              </div>
              
              {loadingLists ? (
                  <span className="stat-label" style={{ padding: '2rem', opacity: 0.5 }}>Cargando listas...</span>
              ) : userLists.map((list) => (
                  <div 
                    key={list.id} 
                    className="activity-card glass" 
                    onClick={() => navigate(`/list/${list.id}`)}
                    style={{ flex: '0 0 140px', height: '100px', justifyContent: 'center', alignItems: 'center', borderRadius: '12px', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                  >
                    {list.cover_image_url && (
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${list.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(2px)', zIndex: 0 }} />
                    )}
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                      <Circle size={20} style={{ marginBottom: '0.4rem', opacity: list.cover_image_url ? 1 : 0.3, color: list.cover_image_url ? 'white' : 'inherit' }} />
                      <span className="stat-label" style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textAlign: 'center', padding: '0 10px', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {list.name}
                      </span>
                      <span style={{ fontSize: '0.55rem', opacity: 0.8, color: 'white' }}>{list.items ? list.items.length : 0} items</span>
                    </div>
                  </div>
              ))}
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
                  <MovieCard key={`profile-movie-${movie.id || idx}-${idx}`} movie={movie} onClick={handleCardClick} />
                ))
              ) : (
                <div className="stat-label" style={{ padding: '2rem', opacity: 0.5 }}>
                  {user?.letterboxd_username ? "No se encontraron películas. Prueba con otro usuario." : "Conecta tu Letterboxd para ver tus películas reales."}
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

      <MediaDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        item={selectedItem}
        type={selectedType}
        onAddToList={handleOpenAddToList}
      />

      <AddToListModal
        isOpen={addToListModalOpen}
        onClose={() => setAddToListModalOpen(false)}
        originalItem={selectedItem}
        type={selectedType}
      />
    </div>
  );
};


export default Profile;





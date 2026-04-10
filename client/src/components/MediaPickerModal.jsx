import React, { useState, useEffect } from 'react';
import { Search, X, Film, Music, List as ListIcon, Loader2, Sparkles } from 'lucide-react';
import { movieApi, spotifyApi, listsApi, favoritesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import LoadingDots from './LoadingDots';

const MediaPickerModal = ({ onSelect, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('listas'); // 'listas', 'peliculas', 'musica'
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentPeliculas, setRecentPeliculas] = useState([]);
  const [recentMusica, setRecentMusica] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, [activeTab]);

  const loadInitialData = async () => {
    setLoading(true);
    setItems([]);
    try {
      if (activeTab === 'listas') {
        const res = await listsApi.getAll(user.id);
        setItems(res.data.map(l => ({
          id: l.id,
          type: 'list',
          title: l.name,
          image: l.cover_image_url || 'https://images.unsplash.com/photo-1514525253361-bee8a1874281?q=80&w=200&h=200&auto=format&fit=crop',
          subtitle: `${l.items?.length || 0} elementos • de ${l.user?.name || 'mí'}`
        })));
      } else if (activeTab === 'peliculas') {
        if (!query) {
           // Show Letterboxd recent or Trending
           if (recentPeliculas.length > 0) {
             setItems(recentPeliculas);
           } else {
             const username = user.letterboxd_username;
             if (username) {
               const res = await movieApi.getLetterboxd(username);
               const formatted = res.data.slice(0, 10).map(m => ({
                 id: m.id,
                 type: 'movie',
                 title: m.title,
                 image: m.poster || m.image,
                 subtitle: m.year || 'Película'
               }));
               setRecentPeliculas(formatted);
               setItems(formatted);
             }
           }
        } else {
          handleSearch();
        }
      } else if (activeTab === 'musica') {
        if (!query) {
           if (recentMusica.length > 0) {
             setItems(recentMusica);
           } else {
             const res = await spotifyApi.getRecentlyPlayed(10);
             const formatted = res.data.map(t => ({
               id: t.id,
               type: 'song',
               title: t.name,
               image: t.album?.images[0]?.url,
               subtitle: t.artists?.map(a => a.name).join(', ')
             }));
             setRecentMusica(formatted);
             setItems(formatted);
           }
        } else {
          handleSearch();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      if (activeTab === 'peliculas') {
        const res = await movieApi.search(query);
        setItems(res.data.slice(0, 15).map(m => ({
          id: m.id,
          type: 'movie',
          title: m.title,
          image: m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster',
          subtitle: m.release_date?.split('-')[0] || 'Película'
        })));
      } else if (activeTab === 'musica') {
        const res = await spotifyApi.searchTracks(query);
        setItems(res.data.map(t => ({
          id: t.id,
          type: 'song',
          title: t.name,
          image: t.album?.images[0]?.url,
          subtitle: t.artists?.map(a => a.name).join(', ')
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) handleSearch();
      else if (activeTab !== 'listas') loadInitialData();
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="media-picker-overlay animate-fadeIn">
      <div className="media-picker-container">
        <div className="media-picker-header">
          <h3>Compartir contenido</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="media-picker-tabs">
          <button 
            className={`tab-btn ${activeTab === 'listas' ? 'active' : ''}`}
            onClick={() => { setActiveTab('listas'); setQuery(''); }}
          >
            <ListIcon size={16} /> Mis Listas
          </button>
          <button 
            className={`tab-btn ${activeTab === 'peliculas' ? 'active' : ''}`}
            onClick={() => { setActiveTab('peliculas'); setQuery(''); }}
          >
            <Film size={16} /> Películas
          </button>
          <button 
            className={`tab-btn ${activeTab === 'musica' ? 'active' : ''}`}
            onClick={() => { setActiveTab('musica'); setQuery(''); }}
          >
            <Music size={16} /> Música
          </button>
        </div>

        {activeTab !== 'listas' && (
          <div className="media-search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={activeTab === 'peliculas' ? 'Buscar películas...' : 'Buscar canciones...'} 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button className="clear-search" onClick={() => setQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <div className="media-results-list">
          {!query && activeTab !== 'listas' && (
            <div className="recent-header">
              <Sparkles size={14} />
              <span>{activeTab === 'peliculas' ? 'Visto recientemente' : 'Escuchado recientemente'}</span>
            </div>
          )}
          
          {loading ? (
            <div className="media-loading">
              <LoadingDots />
            </div>
          ) : items.length > 0 ? (
            <div className="media-grid">
              {items.map(item => (
                <div key={`${item.type}-${item.id}`} className="media-picker-item" onClick={() => onSelect(item)}>
                  <div className="item-thumbnail">
                    <img src={item.image} alt="" />
                    <div className="item-type-tag">
                      {item.type === 'movie' ? <Film size={12} /> : item.type === 'song' ? <Music size={12} /> : <ListIcon size={12} />}
                    </div>
                  </div>
                  <div className="item-details">
                    <span className="item-title">{item.title}</span>
                    <span className="item-subtitle">{item.subtitle}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>{query ? 'No se encontraron resultados' : 'No hay elementos recientes'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPickerModal;

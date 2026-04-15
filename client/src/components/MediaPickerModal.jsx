import React, { useState, useEffect } from 'react';
import { Search, X, Film, Music, List as ListIcon, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { movieApi, spotifyApi, listsApi, favoritesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import LoadingDots from './LoadingDots';

const MediaPickerModal = ({ onSelect, onClose }) => {
  const { t } = useTranslation();
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
        const data = Array.isArray(res.data) ? res.data : [];
        setItems(data.map(l => ({
          id: l.id,
          type: 'list',
          title: l.name,
          image: l.cover_image_url || 'https://images.unsplash.com/photo-1514525253361-bee8a1874281?q=80&w=200&h=200&auto=format&fit=crop',
          subtitle: t('list.elementsBy', { count: l.items?.length || 0, name: l.user?.name || t('common.me') })
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
               const data = Array.isArray(res.data) ? res.data : [];
               const formatted = data.slice(0, 10).map(m => ({
                 id: m.id,
                 type: 'movie',
                 title: m.title,
                 image: m.poster || m.image,
                 subtitle: m.year || t('common.movie')
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
             // Spotify recently played returns { items: [...] }
             const data = res.data?.items && Array.isArray(res.data.items) ? res.data.items : [];
             const formatted = data.map(item => {
               const track = item.track || item;
               return {
                 id: track.id,
                 type: 'song',
                 title: track.name,
                 image: track.album?.images[0]?.url,
                 subtitle: track.artists?.map(a => a.name).join(', ')
               };
             });
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
        const data = Array.isArray(res.data) ? res.data : [];
        setItems(data.slice(0, 15).map(m => ({
          id: m.id,
          type: 'movie',
          title: m.title,
          image: m.poster || 'https://images.unsplash.com/photo-1485846234645-a62644ffb917?q=80&w=300&h=450&auto=format&fit=crop',
          subtitle: m.year || t('common.movie')
        })));
      } else if (activeTab === 'musica') {
        const res = await spotifyApi.searchTracks(query);
        // Spotify search returns { tracks: { items: [...] } }
        const data = res.data?.tracks?.items && Array.isArray(res.data.tracks.items) ? res.data.tracks.items : [];
        setItems(data.map(t => ({
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
          <h3>{t('common.shareContent')}</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="media-picker-tabs">
          <button 
            className={`tab-btn ${activeTab === 'listas' ? 'active' : ''}`}
            onClick={() => { setActiveTab('listas'); setQuery(''); }}
          >
            <ListIcon size={16} /> {t('nav.lists')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'peliculas' ? 'active' : ''}`}
            onClick={() => { setActiveTab('peliculas'); setQuery(''); }}
          >
            <Film size={16} /> {t('search.movies')}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'musica' ? 'active' : ''}`}
            onClick={() => { setActiveTab('musica'); setQuery(''); }}
          >
            <Music size={16} /> {t('search.music')}
          </button>
        </div>

        {activeTab !== 'listas' && (
          <div className="media-search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder={activeTab === 'peliculas' ? t('search.placeholderMovie') : t('search.placeholderSong')} 
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
              <span>{activeTab === 'peliculas' ? t('detail.recentlyWatched') : t('detail.recentlyHeard')}</span>
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
              <p>{query ? t('search.noResultsSmall') : t('search.noRecentItems')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPickerModal;

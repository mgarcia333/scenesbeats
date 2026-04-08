import React, { useState, useEffect } from 'react';
import { X, Search, Loader } from 'lucide-react';
import { movieApi, nodeApi } from '../api';
import { useTranslation } from 'react-i18next';

const SearchModal = ({ isOpen, onClose, onSelect, type }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) { setQuery(''); setResults([]); }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      if (type === 'movie') {
        const res = await movieApi.search(query);
        setResults(res.data);
      } else {
        const res = await nodeApi.get(`/spotify/search?query=${query}&type=${type}`);
        const items = type === 'song' ? res.data.tracks.items : res.data.albums.items;
        setResults(items.map(i => ({
          id: i.id, title: i.name, artwork: type === 'song' ? i.album.images[0]?.url : i.images[0]?.url,
          artist: i.artists[0].name
        })));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, backdropFilter: 'blur(10px)' }}>
      <div className="modal-content glass" style={{ maxWidth: '600px', width: '90%', borderRadius: '20px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', opacity: 0.6 }}>{t('search.movies')} / {t('search.music')}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white' }}><X size={24} /></button>
        </div>
        
        <div className="search-bar-container" style={{ marginBottom: '1.5rem' }}>
          <Search size={20} className="search-icon" />
          <input 
            autoFocus className="search-input" placeholder={t('search.placeholder')} 
            value={query} onChange={(e) => setQuery(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="rec-button" style={{ padding: '0.5rem 1rem', width: 'auto' }}>Go</button>
        </div>

        <div className="search-results-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}><Loader className="spin" /></div> : results.map((item, idx) => (
            <div key={idx} onClick={() => onSelect(item)} className="search-result-item" style={{ display: 'flex', gap: '1rem', padding: '0.75rem', cursor: 'pointer', borderRadius: '10px' }}>
              <img src={item.poster || item.artwork} alt="" style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.title || item.name}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{item.year || item.artist}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;

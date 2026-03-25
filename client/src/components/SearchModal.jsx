import React, { useState, useEffect } from 'react';
import { Search, X, Film, Music, Disc } from 'lucide-react';

const SearchModal = ({ isOpen, onClose, onSelect, type, title }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        let endpoint = '';
        if (type === 'movie') {
          endpoint = `/api/movie/search?query=${query}`;
        } else if (type === 'song') {
          endpoint = `/api/spotify/search?query=${query}&type=track`;
        } else if (type === 'album') {
          endpoint = `/api/spotify/search?query=${query}&type=album`;
        }

        const res = await fetch(endpoint, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (type === 'movie') {
            setResults(data);
          } else if (type === 'song') {
            setResults(data.tracks.items.map(t => ({
              id: t.id,
              name: t.name,
              artist: t.artists[0].name,
              artwork: t.album.images[0]?.url
            })));
          } else if (type === 'album') {
            setResults(data.albums.items.map(a => ({
              id: a.id,
              name: a.name,
              artist: a.artists[0].name,
              artwork: a.images[0]?.url
            })));
          }
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [query, type]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        
        <div className="modal-search-bar">
          <Search size={18} className="search-icon" />
          <input 
            autoFocus
            type="text" 
            placeholder={`Buscar ${title.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="modal-results">
          {loading ? (
            <div className="modal-loading">Buscando...</div>
          ) : results.length > 0 ? (
            results.map((item, idx) => (
              <div key={item.id || idx} className="result-item" onClick={() => onSelect(item)}>
                <img src={item.poster || item.artwork || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=100&h=150&fit=crop"} alt={item.name || item.title} />
                <div className="result-info">
                  <div className="result-name">{item.name || item.title}</div>
                  <div className="result-meta">{item.artist || item.year}</div>
                </div>
              </div>
            ))
          ) : query && !loading ? (
            <div className="no-results">No se encontraron resultados.</div>
          ) : (
            <div className="modal-tip">Escribe algo para buscar...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import axios from 'axios';

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || ''; // Get it from .env

const GifPicker = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (GIPHY_API_KEY) {
      fetchTrending();
    } else {
      setError("Falta clave de API de Giphy en .env");
    }
  }, []);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12`);
      setGifs(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 403 ? "Clave API inválida (403)" : "Error cargando GIFs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!val) {
      fetchTrending();
      return;
    }

    if (!GIPHY_API_KEY) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${val}&limit=12`);
      setGifs(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 403 ? "Clave API inválida (403)" : "Error buscando GIFs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gif-picker-overlay animate-fadeIn">
      <div className="gif-picker-container">
        <div className="gif-picker-header">
          <div className="gif-search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar GIFs..." 
              value={query}
              onChange={handleSearch}
              autoFocus
            />
          </div>
          <button className="gif-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="gif-results-grid">
          {loading ? (
            <div className="gif-loading">Cargando...</div>
          ) : error ? (
            <div className="gif-error-msg">{error}</div>
          ) : (
            gifs.map(gif => (
              <div 
                key={gif.id} 
                className="gif-item" 
                onClick={() => onSelect(gif.images.fixed_height.url)}
              >
                <img src={gif.images.fixed_height_small.url} alt={gif.title} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GifPicker;

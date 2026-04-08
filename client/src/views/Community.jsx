import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MovieCard, SongCard } from '../components/Cards';
import HorizontalScroll from '../components/HorizontalScroll';
import { Search, Clapperboard, Music } from 'lucide-react';

const Community = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('movies'); // 'movies' or 'music'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term = searchTerm) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const endpoint = searchType === 'movies' 
        ? `/api/movie/search?query=${term}` 
        : `/api/spotify/search?query=${term}&type=track`;
      
      const response = await fetch(endpoint, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        if (searchType === 'movies') {
          setResults(data);
        } else {
          // Spotify returns { tracks: { items: [] } }
          const songs = data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            artwork: track.album.images[0]?.url
          }));
          setResults(songs);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchType]);

  return (
    <div className="view-container">
      <div className="search-header">
        <div className="search-bar-container">
          <span className="search-icon"><Search size={20} /></span>
          <input
            type="text"
            className="search-input"
            placeholder={t('search.placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="search-tabs">
          <button 
            className={`search-tab ${searchType === 'movies' ? 'active' : ''}`}
            onClick={() => setSearchType('movies')}
          >
            <Clapperboard size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {t('search.movies')}
          </button>
          <button 
            className={`search-tab ${searchType === 'music' ? 'active' : ''}`}
            onClick={() => setSearchType('music')}
          >
            <Music size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {t('search.music')}
          </button>
        </div>
      </div>

      <div className="search-results">
        {loading ? (
          <div className="loading-screen" style={{ height: 'auto', padding: '4rem' }}>
            {t('search.searching')}
          </div>
        ) : results.length > 0 ? (
          <div className="results-grid">
            {results.map(item => (
              searchType === 'movies' ? (
                <MovieCard key={item.id} movie={item} />
              ) : (
                <SongCard key={item.id} song={item} />
              )
            ))}
          </div>
        ) : searchTerm.trim() ? (
          <div className="stat-label" style={{ padding: '4rem', textAlign: 'center' }}>
            {t('search.noResults', { query: searchTerm })}
          </div>
        ) : (
          <div className="stat-label" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
            <Search size={48} style={{ display: 'block', margin: '0 auto 1rem', opacity: 0.3 }} />
            Explora la comunidad Scenes & Beats
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;


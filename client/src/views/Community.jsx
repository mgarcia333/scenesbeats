import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MovieCard, SongCard } from '../components/Cards';
import HorizontalScroll from '../components/HorizontalScroll';
import { Search, Clapperboard, Music, Filter, TrendingUp, Sparkles } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import { movieApi, recommendationApi, nodeApi } from '../api';

const Community = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('movies'); // 'movies' or 'music'
  const [results, setResults] = useState([]);
  const [initialData, setInitialData] = useState({ trendingMovies: [], recommendedSongs: [] });
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('');

  const movieGenres = ['Acción', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción'];
  const musicGenres = ['Pop', 'Rock', 'Hip Hop', 'Dance', 'Indie'];

  const fetchInitialData = async () => {
    setLoadingInitial(true);
    try {
      const res = await recommendationApi.getInitialData();
      setInitialData(res.data);
    } catch (err) {
      console.error("Error fetching initial community data:", err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSearch = async (term = searchTerm, genre = selectedGenre) => {
    const query = genre ? `${genre} ${term}` : term;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      if (searchType === 'movies') {
        const res = await movieApi.search(query);
        setResults(res.data);
      } else {
        const res = await nodeApi.get(`/spotify/search?query=${encodeURIComponent(query)}&type=track`);
        const data = res.data;
        const songs = data.tracks.items.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          artwork: track.album.images[0]?.url
        }));
        setResults(songs);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() || selectedGenre) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchType, selectedGenre]);

  const handleGenreClick = (genre) => {
    setSelectedGenre(prev => prev === genre ? '' : genre);
  };

  const renderDiscoverySection = () => (
    <div className="discovery-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <section className="feed-section" style={{ marginBottom: '2.5rem' }}>
        <h3 className="section-title" style={{ fontSize: '0.9rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <TrendingUp size={18} color="var(--primary-color)" /> {t('home.latestMovies')}
        </h3>
        <HorizontalScroll>
          {initialData.trendingMovies.map((movie, idx) => (
            <MovieCard key={`trending-movie-${movie.id}-${idx}`} movie={movie} />
          ))}
        </HorizontalScroll>
      </section>

      <section className="feed-section">
        <h3 className="section-title" style={{ fontSize: '0.9rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles size={18} color="var(--accent-blue)" /> Canciones Recomendadas
        </h3>
        <HorizontalScroll>
          {initialData.recommendedSongs.map((song, idx) => (
            <SongCard key={`recommended-song-${song.id}-${idx}`} song={song} />
          ))}
        </HorizontalScroll>
      </section>
    </div>
  );

  return (
    <div className="view-container">
      <div className="search-header-advanced glass" style={{ 
        borderRadius: '24px', 
        padding: '2rem', 
        marginBottom: '2.5rem',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 15px 45px rgba(0,0,0,0.5)',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))'
      }}>
        <div className="search-bar-premium" style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <Search size={22} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input
            type="text"
            className="search-input-premium"
            placeholder={searchType === 'movies' ? "Busca una película que te apetezca..." : "Busca ese ritmo que tienes en la cabeza..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%',
              padding: '1.2rem 1.5rem 1.2rem 4rem',
              fontSize: '1.1rem',
              borderRadius: '100px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div className="type-toggle glass" style={{ display: 'flex', padding: '4px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)' }}>
            <button 
              onClick={() => { setSearchType('movies'); setSelectedGenre(''); }}
              style={{ 
                padding: '0.6rem 1.2rem', 
                borderRadius: '100px', 
                border: 'none', 
                background: searchType === 'movies' ? 'var(--primary-color)' : 'transparent',
                color: searchType === 'movies' ? 'black' : 'white',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <Clapperboard size={16} /> Cine
            </button>
            <button 
              onClick={() => { setSearchType('music'); setSelectedGenre(''); }}
              style={{ 
                padding: '0.6rem 1.2rem', 
                borderRadius: '100px', 
                border: 'none', 
                background: searchType === 'music' ? 'var(--primary-color)' : 'transparent',
                color: searchType === 'music' ? 'black' : 'white',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <Music size={16} /> Música
            </button>
          </div>

          <div className="genre-filters" style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', padding: '0.2rem', scrollbarWidth: 'none' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.5, display: 'flex', alignItems: 'center', marginRight: '0.4rem' }}><Filter size={14} /></span>
            {(searchType === 'movies' ? movieGenres : musicGenres).map(genre => (
              <button
                key={genre}
                onClick={() => handleGenreClick(genre)}
                className={`genre-chip ${selectedGenre === genre ? 'active' : ''}`}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '100px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: selectedGenre === genre ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.03)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="community-content">
        {loadingInitial ? (
          <div style={{ padding: '6rem 0' }}>
            <LoadingScreen message="Preparando el escenario..." />
          </div>
        ) : (searchTerm.trim() || selectedGenre) ? (
          loading ? (
            <div style={{ padding: '4rem 0' }}>
              <LoadingScreen message="Buscando tesoros..." />
            </div>
          ) : results.length > 0 ? (
            <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1.5rem' }}>
              {results.map((item, idx) => (
                searchType === 'movies' ? (
                  <MovieCard key={`search-movie-${item.id || idx}-${idx}`} movie={item} showRating={true} />
                ) : (
                  <SongCard key={`search-song-${item.id || idx}-${idx}`} song={item} showRating={false} />
                )
              ))}
            </div>
          ) : (
            <div className="stat-label" style={{ padding: '6rem', textAlign: 'center', opacity: 0.5 }}>
              No hemos encontrado nada para "{searchTerm || selectedGenre}". Prueba otra vibra.
            </div>
          )
        ) : (
          renderDiscoverySection()
        )}
      </div>
    </div>
  );
};

export default Community;



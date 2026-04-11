import React, { useState } from 'react';
import { Music, Film, Sparkles, AlertCircle, RotateCcw, Compass, Music4, Clapperboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { recommendationApi, favoritesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import LoadingDots from '../components/LoadingDots';

const Recommendations = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [loadingRec, setLoadingRec] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState('movie_from_music');
  const [isGenerating, setIsGenerating] = useState(false);

  const getRecommendation = async () => {
    if (isGenerating) return;
    
    setLoadingRec(true);
    setErrorMsg("");
    setRecommendation(null);
    setIsGenerating(true);

    let lb_username = user?.letterboxd_username;
    const allFavorites = {
      movies: [],
      songs: [],
      albums: [],
      artists: [],
      actors: [],
      directors: []
    };

    try {
      if (user && user.id) {
        const favRes = await favoritesApi.getAll(user.id);
        const favs = favRes.data || [];
        
        allFavorites.movies = favs.filter(f => f.type === 'movie_fav').map(m => ({ 
          title: m.title, 
          subtitle: m.subtitle,
          image_url: m.image_url 
        }));
        allFavorites.songs = favs.filter(f => f.type === 'song_fav').map(s => ({ 
          title: s.title, 
          subtitle: s.subtitle,
          image_url: s.image_url 
        }));
        allFavorites.albums = favs.filter(f => f.type === 'album_fav').map(a => ({ 
          title: a.title, 
          subtitle: a.subtitle,
          image_url: a.image_url 
        }));
        allFavorites.artists = favs.filter(f => f.type === 'artist_fav').map(a => ({ 
          title: a.title, 
          subtitle: a.subtitle,
          image_url: a.image_url 
        }));
        allFavorites.actors = favs.filter(f => f.type === 'actor_fav').map(a => ({ 
          title: a.title, 
          subtitle: a.subtitle,
          image_url: a.image_url 
        }));
        allFavorites.directors = favs.filter(f => f.type === 'director_fav').map(d => ({ 
          title: d.title, 
          subtitle: d.subtitle,
          image_url: d.image_url 
        }));

        console.log('All favorites loaded:', allFavorites);
      }
    } catch (e) {
      console.warn("Favs fetch failed:", e);
    }

    if ((mode === 'movie_from_movies' || mode === 'song_from_movies' || mode === 'hybrid') && !lb_username && allFavorites.movies.length === 0) {
      setErrorMsg(t('rec.errorLB'));
      setLoadingRec(false);
      return;
    }

    try {
      const res = await recommendationApi.generate({
        mode,
        lb_username,
        all_favorites: allFavorites,
        lang: i18n.language,
        userId: user?.id
      });
      setRecommendation(res.data);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || t('rec.errorGeneral'));
    } finally {
      setLoadingRec(false);
      setIsGenerating(false);
    }
  };

  return (
    <div className="view-container">
      <div className="rec-container">
        {/* Header Section */}
        <div className="rec-header">
          <h2 className="rec-title-main animate-fadeIn">{t('rec.title')}</h2>
          <p className="rec-subtitle-main">{t('rec.subtitle')}</p>
        </div>

        {/* Mode Selection Grid with Button */}
        <div className="rec-modes-grid animate-fadeIn">
          <div 
            className={`rec-mode-card ${mode === 'movie_from_music' ? 'active' : ''}`}
            onClick={() => setMode('movie_from_music')}
          >
            <div className="mode-icon-box"><Music4 size={22} /></div>
            <div className="mode-info">
              <h4>{t('rec.modeMovieFromMusic')}</h4>
              <p>{t('rec.modeMovieFromMusicDesc')}</p>
            </div>
          </div>

          <div 
            className={`rec-mode-card ${mode === 'song_from_movies' ? 'active' : ''}`}
            onClick={() => setMode('song_from_movies')}
          >
            <div className="mode-icon-box"><Clapperboard size={22} /></div>
            <div className="mode-info">
              <h4>{t('rec.modeSongFromMovies')}</h4>
              <p>{t('rec.modeSongFromMoviesDesc')}</p>
            </div>
          </div>

          <div 
            className={`rec-mode-card ${mode === 'hybrid' ? 'active' : ''}`}
            onClick={() => setMode('hybrid')}
          >
            <div className="mode-icon-box"><Compass size={22} /></div>
            <div className="mode-info">
              <h4>{t('rec.modeHybridFull')}</h4>
              <p>{t('rec.modeHybridFullDesc')}</p>
            </div>
          </div>

          {!recommendation && !loadingRec && (
            <button 
              onClick={getRecommendation} 
              className="rec-mode-btn-generate"
              disabled={isGenerating}
            >
              <Sparkles size={16} />
              {t('rec.getBtn')}
            </button>
          )}
        </div>

        {/* Loading State */}
        {loadingRec && (
          <div className="rec-hero-action animate-fadeIn">
            <LoadingDots />
            <p className="rec-loader-text" style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              Curating your next favorite...
            </p>
          </div>
        )}

        {/* Error State */}
        {errorMsg && (
          <div className="error-banner animate-shake" style={{ margin: '2rem 0' }}>
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Premium Result Section */}
        {recommendation && (
          <div className="rec-result-viewport">
            <div className="rec-premium-card">
              {/* The Mood Banner */}
              <div className="rec-mood-banner">
                <span className="mood-label">THE MOOD</span>
                <span className="mood-text">{recommendation.vibra}</span>
              </div>

              <div className="rec-main-content">
                <div className="rec-item-stack">
                  {/* Movie Recommendation */}
                  {recommendation.pelicula && (
                    <div className="rec-entry">
                      <div className="rec-media-wrapper">
                        {recommendation.poster_url ? (
                          <img src={recommendation.poster_url} alt={recommendation.pelicula} className="rec-media-img" />
                        ) : (
                          <div className="rec-visual-placeholder"><Film size={48} /></div>
                        )}
                      </div>
                      <div className="rec-info-panel">
                        <span className="rec-type-tag">{t('rec.movieRecLabel')}</span>
                        <h3 className="rec-item-title">{recommendation.pelicula}</h3>
                        <p className="rec-synopsis-text">{recommendation.sinopsis}</p>
                      </div>
                    </div>
                  )}

                  {/* Song Recommendation */}
                  {recommendation.song_metadata && (
                    <div className="rec-entry">
                      <div className="rec-media-wrapper music">
                        <img src={recommendation.song_metadata.artwork} alt={recommendation.song_metadata.name} className="rec-media-img" />
                      </div>
                      <div className="rec-info-panel">
                        <span className="rec-type-tag">{t('rec.songRecLabel')}</span>
                        <h3 className="rec-item-title">{recommendation.song_metadata.name}</h3>
                        <p className="rec-item-subtitle">{recommendation.song_metadata.artist}</p>
                        <a href={recommendation.song_metadata.url} target="_blank" rel="noopener noreferrer" className="spotify-play-pill">
                          <Music size={16} /> {t('rec.listenOnSpotify')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* The Connection (Reasoning) */}
                <div className="rec-connection-box">
                  <div className="connection-header">
                    <Sparkles size={16} />
                    <h4>THE CONNECTION</h4>
                  </div>
                  <p className="connection-body">{recommendation.motivo}</p>
                </div>

                {/* Footer Action */}
                <div className="rec-actions-footer">
                  <button onClick={getRecommendation} className="btn-retry-glass">
                    <RotateCcw size={18} />
                    {t('rec.newBtn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;

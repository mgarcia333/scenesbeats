import React, { useState } from 'react';
import { Music, Film, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
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

  const getRecommendation = async () => {
    setLoadingRec(true);
    setErrorMsg("");
    setRecommendation(null);

    let lb_username = user?.letterboxd_username;
    let fav_movies = [];
    let fav_songs = [];

    try {
      if (user && user.id) {
        const favRes = await favoritesApi.getAll(user.id);
        const allFavs = favRes.data;
        fav_movies = allFavs.filter(f => f.type === 'movie');
        fav_songs = allFavs.filter(f => f.type === 'song');
      }
    } catch (e) {
      console.warn("Favs fetch failed");
    }

    if ((mode === 'movie_from_movies' || mode === 'song_from_movies' || mode === 'hybrid') && !lb_username) {
      setErrorMsg(t('rec.errorLB'));
      setLoadingRec(false);
      return;
    }

    try {
      const res = await recommendationApi.generate({
        mode,
        lb_username,
        fav_movies: fav_movies.map(m => ({ title: m.title })),
        fav_songs: fav_songs.map(s => ({ title: s.name || s.title })),
        lang: i18n.language,
        userId: user?.id
      });
      setRecommendation(res.data);
    } catch (err) {
      console.error("Recommendation Error:", err);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.error;
      if (status === 503) {
        setErrorMsg(serverMsg || 'La IA está saturada ahora mismo. Espera unos segundos e inténtalo de nuevo.');
      } else if (status === 401) {
        setErrorMsg(t('rec.errorSpotify'));
      } else {
        setErrorMsg(serverMsg || t('rec.errorGeneral'));
      }
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <div className="view-container">
      {/* Header Section */}
      <div className="rec-header">
        <h2 className="section-title">{t('rec.title')}</h2>
        <p className="rec-subtitle">Deja que la IA analice tu vibra musical y cinéfila para descubrir tu próxima obsesión.</p>
      </div>

      {/* Mode Selection Cards */}
      <div className="rec-modes-grid animate-fadeIn">
        <div 
          className={`rec-mode-card ${mode === 'movie_from_music' ? 'active' : ''}`}
          onClick={() => setMode('movie_from_music')}
        >
          <div className="mode-card-icon"><Film size={24} /></div>
          <div className="mode-card-info">
            <h4>{t('rec.modeMovieFromMusic')}</h4>
            <p>Tu cine ideal basado en lo que escuchas hoy.</p>
          </div>
        </div>

        <div 
          className={`rec-mode-card ${mode === 'song_from_movies' ? 'active' : ''}`}
          onClick={() => setMode('song_from_movies')}
        >
          <div className="mode-card-icon"><Music size={24} /></div>
          <div className="mode-card-info">
            <h4>{t('rec.modeSongFromMovies')}</h4>
            <p>La banda sonora de tus películas favoritas.</p>
          </div>
        </div>

        <div 
          className={`rec-mode-card ${mode === 'hybrid' ? 'active' : ''}`}
          onClick={() => setMode('hybrid')}
        >
          <div className="mode-card-icon"><Sparkles size={24} /></div>
          <div className="mode-card-info">
            <h4>{t('rec.modeHybridFull')}</h4>
            <p>Experiencia total: una película y una canción conectadas.</p>
          </div>
        </div>
      </div>

      {/* Action Area */}
      {!recommendation && !loadingRec && (
        <div className="rec-action-hero">
          <div className="rec-hero-icon">
            <Sparkles size={48} />
          </div>
          <button onClick={getRecommendation} className="rec-main-button">
            {t('rec.getBtn')}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loadingRec && (
        <div className="rec-loading-container animate-fadeIn">
          <div className="rec-loader-box">
            <LoadingDots />
            <p className="rec-loader-text">{t('home.loading')}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {errorMsg && (
        <div className="error-banner animate-shake">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={getRecommendation}
            disabled={loadingRec}
            className="error-retry-btn"
          >
            {loadingRec ? <LoadingDots className="mini-loader" /> : 'Reintentar'}
          </button>
        </div>
      )}

      {/* Result Section */}
      {recommendation && (
        <div className="rec-result-view animate-fadeIn">
          <div className="rec-result-card overflow-hidden">
            <div className="rec-card-content">
              {/* Analysis Header */}
              <div className="vibe-badge">
                <Sparkles size={14} />
                <span>Análisis de IA: {recommendation.vibra}</span>
              </div>

              <div className="rec-output-container">
                {/* Movie Recommendation */}
                {recommendation.pelicula && (
                  <div className="rec-item-display">
                     <div className="rec-item-media">
                        {recommendation.poster_url ? (
                          <img src={recommendation.poster_url} alt={recommendation.pelicula} className="rec-visual-main shadow-xl" />
                        ) : (
                          <div className="rec-visual-placeholder"><Film size={48} /></div>
                        )}
                     </div>
                     <div className="rec-item-info">
                        <span className="rec-tag">PELÍCULA RECOMENDADA</span>
                        <h3 className="rec-title-big">{recommendation.pelicula}</h3>
                        <p className="rec-synopsis">{recommendation.sinopsis}</p>
                     </div>
                  </div>
                )}

                {/* Song Recommendation */}
                {recommendation.song_metadata && (
                  <div className={`rec-item-display ${recommendation.pelicula ? 'with-divider' : ''}`}>
                     <div className="rec-item-media music-media">
                        <img src={recommendation.song_metadata.artwork} alt={recommendation.song_metadata.name} className="rec-visual-song shadow-xl" />
                     </div>
                     <div className="rec-item-info">
                        <span className="rec-tag">CANCIÓN RECOMENDADA</span>
                        <h3 className="rec-title-big">{recommendation.song_metadata.name}</h3>
                        <p className="rec-subtitle-big">{recommendation.song_metadata.artist}</p>
                        <a href={recommendation.song_metadata.url} target="_blank" rel="noopener noreferrer" className="spotify-play-btn">
                          <Music size={16} /> Escuchar en Spotify
                        </a>
                     </div>
                  </div>
                )}

                {/* Unified Reason */}
                <div className="rec-reason-box">
                  <h4 className="rec-reason-title">
                    <Sparkles size={14} />
                    ¿POR QUÉ ESTA ELECCIÓN?
                  </h4>
                  <p className="rec-reason-text">{recommendation.motivo}</p>
                </div>

                <div className="rec-footer-actions">
                  <button onClick={getRecommendation} className="rec-retry-button">
                    <RotateCcw size={16} />
                    Nueva recomendación
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Recommendations;

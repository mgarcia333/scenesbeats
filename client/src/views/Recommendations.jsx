import React, { useState } from 'react';
import { Music, Film, Sparkles, AlertCircle } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import { recommendationApi, favoritesApi } from '../api';
import { useAuth } from '../context/AuthContext';

const Recommendations = () => {
  const { user } = useAuth();
  const [loadingRec, setLoadingRec] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mode, setMode] = useState('spotify'); // 'spotify', 'letterboxd', 'hybrid'

  const getRecommendation = async () => {
    setLoadingRec(true);
    setErrorMsg("");
    setRecommendation(null);

    // 1. Fetch User Data to get Laravel ID if possible
    // (In a real app, this would be in a global context/store)
    let lb_username = localStorage.getItem('lb_username');
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
      console.warn("Could not fetch persistent favorites, falling back to local storage if available.");
      fav_movies = JSON.parse(localStorage.getItem('fav_movies') || '[]');
      fav_songs = JSON.parse(localStorage.getItem('fav_songs') || '[]');
    }

    if (mode === 'letterboxd' && !lb_username) {
      setErrorMsg("Necesitas conectar tu Letterboxd en el Perfil para usar este modo.");
      setLoadingRec(false);
      return;
    }

    try {
      const res = await recommendationApi.generate({
          mode,
          lb_username,
          fav_movies: fav_movies.map(m => ({ title: m.title })), // Simplify for Gemini
          fav_songs: fav_songs.map(s => ({ title: s.title }))
      });
      
      setRecommendation(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setErrorMsg("Tu sesión de Spotify ha expirado. Por favor, ve al Inicio e inicia sesión de nuevo.");
      } else {
        setErrorMsg(err.response?.data?.error || "Error al obtener recomendación.");
      }
    } finally {
      setLoadingRec(false);
    }
  };

  const modes = [
    { id: 'spotify', name: 'Vibra Actual', icon: <Music size={18} />, desc: 'Basado en tus últimas canciones' },
    { id: 'letterboxd', name: 'Cinefilia', icon: <Film size={18} />, desc: 'Basado en tu Letterboxd' },
    { id: 'hybrid', name: 'Mix Personalizado', icon: <Sparkles size={18} />, desc: 'Música + Cine + Favoritos' }
  ];

  return (
    <div className="view-container">
      <h2 className="section-title">Recomendaciones</h2>
      
      <div className="mode-selector-container glass" style={{ marginBottom: '2rem', padding: '0.5rem', borderRadius: '16px', display: 'flex', gap: '0.5rem' }}>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`mode-btn ${mode === m.id ? 'active' : ''}`}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.8rem 0.4rem',
              borderRadius: '12px',
              border: 'none',
              background: mode === m.id ? 'var(--primary-color)' : 'transparent',
              color: mode === m.id ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          >
            {m.icon}
            <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{m.name}</span>
          </button>
        ))}
      </div>

      {loadingRec ? (
        <div style={{ padding: '4rem 0' }}>
          <LoadingScreen message="Invocando a la IA cineasta..." />
        </div>
      ) : (
        <div className="recommendation-hero glass" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)', padding: '3rem 2rem', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', background: 'linear-gradient(135deg, rgba(0,122,255,0.1), transparent)', textAlign: 'center' }}>
          <p className="hero-text" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '500', marginBottom: '1.5rem' }}>
            {modes.find(m => m.id === mode).desc}
          </p>
          <button 
            onClick={getRecommendation} 
            className="btn-glossy"
            disabled={loadingRec}
            style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '500px' }}
          >
            {recommendation ? "Probar de nuevo" : "Obtener Recomendación"}
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="error-card glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginTop: '1.5rem', borderLeft: '4px solid #ff4b4b', borderRadius: '12px' }}>
          <AlertCircle size={20} color="#ff4b4b" />
          <p style={{ color: '#ff4b4b', fontSize: '0.9rem' }}>{errorMsg}</p>
        </div>
      )}

      {recommendation && (
        <div className="recommendation-result glass" style={{ borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', marginTop: '2.5rem', overflow: 'hidden' }}>
          <div className="result-header" style={{ padding: '1.5rem 1.5rem 0 1.5rem' }}>
             <span className="vibra-badge" style={{ background: 'var(--primary-color)', boxShadow: '0 4px 12px rgba(0,122,255,0.4)', color: 'white', padding: '0.4rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '700' }}>VIBRA: {recommendation.vibra}</span>
          </div>
          <div className="result-content" style={{ padding: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {recommendation.poster_url && (
              <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', flexShrink: 0, width: '200px' }}>
                <img src={recommendation.poster_url} alt={recommendation.pelicula} className="result-poster" style={{ width: '100%', height: 'auto', display: 'block' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.1) 0%, transparent 40%)', pointerEvents: 'none' }}></div>
              </div>
            )}
            <div className="result-info" style={{ flex: '1', minWidth: '280px' }}>
              <h3 className="result-title" style={{ fontSize: '2.4rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)', marginBottom: '1rem', lineHeight: '1.1' }}>{recommendation.pelicula}</h3>
              <p className="result-synopsis" style={{ opacity: 0.9, lineHeight: '1.6', fontSize: '1rem', marginBottom: '1.5rem' }}>{recommendation.sinopsis}</p>
              <div className="result-reason" style={{ background: 'rgba(255,255,255,0.04)', borderLeft: '4px solid var(--primary-color)', borderRadius: '12px', padding: '1.25rem' }}>
                <h4 style={{ color: 'var(--primary-color)', fontSize: '0.75rem', letterSpacing: '0.15em', marginBottom: '0.6rem', fontWeight: '800', textTransform: 'uppercase' }}>¿Por qué?</h4>
                <p style={{ fontStyle: 'italic', fontSize: '0.95rem', lineHeight: '1.5' }}>{recommendation.motivo}</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Recommendations;


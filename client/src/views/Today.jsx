import React, { useState } from 'react';
import { recommendationApi } from '../api';

const Today = () => {
  const [loadingRec, setLoadingRec] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const getRecommendation = async () => {
    setLoadingRec(true);
    setErrorMsg("");
    setRecommendation(null);
    try {
      const res = await recommendationApi.generate();
      setRecommendation(res.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        setErrorMsg("Tu sesión de Spotify ha expirado o no se ha encontrado. Por favor, ve a la Home e inicia sesión de nuevo.");
      } else {
        setErrorMsg(err.response?.data?.error || "Error de red al conectar con el servidor.");
      }
      console.error(err);
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <div className="view-container">
      <h2 className="section-title">Recomendación del Día</h2>
      
      <div className="recommendation-hero">
        <p className="hero-text">Analizamos tu vibra musical actual para encontrarte la película perfecta.</p>
        <button 
          onClick={getRecommendation} 
          className="rec-button"
          disabled={loadingRec}
        >
          {loadingRec ? "Sincronizando..." : "Descubrir mi Película"}
        </button>
      </div>

      {errorMsg && <p className="error-text">{errorMsg}</p>}

      {recommendation && (
        <div className="recommendation-result">
          <div className="result-header">
             <span className="vibra-badge">Tu Vibra: {recommendation.vibra}</span>
          </div>
          <div className="result-content">
            {recommendation.poster_url && (
              <img src={recommendation.poster_url} alt={recommendation.pelicula} className="result-poster" />
            )}
            <div className="result-info">
              <h3 className="result-title">{recommendation.pelicula}</h3>
              <p className="result-synopsis">{recommendation.sinopsis}</p>
              <div className="result-reason">
                <h4>¿Por qué esta película?</h4>
                <p>{recommendation.motivo}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Today;

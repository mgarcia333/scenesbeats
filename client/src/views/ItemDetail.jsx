import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { movieApi, spotifyApi } from '../api';
import { ArrowLeft, Clock, Calendar, Plus, ExternalLink, Music, Film, Info } from 'lucide-react';
import LoadingDots from '../components/LoadingDots';
import AddToListModal from '../components/AddToListModal';

const ItemDetail = ({ type }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let res;
        if (type === 'movie') {
          res = await movieApi.getOne(id);
        } else {
          res = await spotifyApi.getTrack(id);
        }
        setItem(res.data);
      } catch (err) {
        console.error('Fetch detail error:', err);
        setError(t('common.error') || 'Error al cargar detalles');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, type, t]);

  if (loading) {
    return (
      <div className="view-container flex-center">
        <LoadingDots />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="view-container flex-center text-center">
        <p className="stat-label">{error || 'Ítem no encontrado'}</p>
        <button className="rec-button mt-4" onClick={() => navigate(-1)}>
          {t('common.back') || 'Volver'}
        </button>
      </div>
    );
  }

  const isMovie = type === 'movie';
  const title = isMovie ? item.title : item.name;
  const subtitle = isMovie ? item.year : item.artist;
  const image = isMovie ? item.poster : item.artwork;

  return (
    <div className="view-container animate-fadeIn">
      {/* Header / Back */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="detail-layout">
        {/* Cover Section */}
        <div className="detail-cover-container">
          <div className="detail-artwork-wrapper">
            {image ? (
              <img src={image} alt={title} className="detail-artwork" />
            ) : (
              <div className="detail-artwork-placeholder">
                {isMovie ? <Film size={60} /> : <Music size={60} />}
              </div>
            )}
            <div className="detail-type-badge">
              {isMovie ? <Film size={14} /> : <Music size={14} />}
              <span>{isMovie ? 'Película' : 'Canción'}</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="detail-info">
          <h1 className="detail-title">{title}</h1>
          <p className="detail-subtitle">{subtitle}</p>

          <div className="detail-meta">
            {isMovie && item.runtime && (
              <div className="detail-meta-item">
                <Clock size={16} />
                <span>{item.runtime} min</span>
              </div>
            )}
            {item.release_date && (
              <div className="detail-meta-item">
                <Calendar size={16} />
                <span>{new Date(item.release_date).getFullYear() || item.year}</span>
              </div>
            )}
          </div>

          <div className="detail-actions">
            <button className="btn-primary-solid w-full" onClick={() => setShowAddModal(true)}>
              <Plus size={20} />
              {t('common.addToList') || 'Añadir a lista'}
            </button>
            
            {item.external_url && (
              <a 
                href={item.external_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-outline w-full mt-2"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <ExternalLink size={18} />
                {isMovie ? 'Ver en Letterboxd' : 'Abrir en Spotify'}
              </a>
            )}
          </div>

          <div className="detail-description">
            <h3 className="detail-section-label">
              <Info size={16} /> 
              {t('common.summary') || 'Resumen'}
            </h3>
            <p className="detail-text">
              {item.overview || item.tagline || (isMovie ? 'Sin descripción disponible.' : `Canción del álbum "${item.album}".`)}
            </p>
          </div>

          {isMovie && item.genres && (
            <div className="detail-genres">
              {item.genres.map((genre, idx) => (
                <span key={idx} className="genre-pill">{genre}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddToListModal 
          item={{
            id: isMovie ? item.id : item.id,
            title: title,
            subtitle: subtitle,
            image_url: image,
            type: type
          }} 
          onClose={() => setShowAddModal(false)} 
        />
      )}
    </div>
  );
};

export default ItemDetail;

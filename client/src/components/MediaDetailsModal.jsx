import React from 'react';
import { X, Heart, Plus, Play, ExternalLink, Star } from 'lucide-react';
import { renderStars } from './Cards';

const MediaDetailsModal = ({ isOpen, onClose, item, type, onAddToList, onToggleFavorite, isFavorite }) => {
  if (!isOpen || !item) return null;

  const isMovie = type === 'movie';
  const title = item.title || item.name;
  const subtitle = item.year || item.artist || item.subtitle || '';
  const image = item.poster || item.artwork || item.image_url || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop";
  const link = item.link || (isMovie ? `https://letterboxd.com/search/${title}/` : `https://open.spotify.com/search/${title}`);

  return (
    <div className="modal-overlay" style={{ zIndex: 1000, backdropFilter: 'blur(10px)' }}>
      <div className="modal-content glass" style={{
        maxWidth: '500px',
        width: '90%',
        padding: 0,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', top: '15px', right: '15px', zIndex: 10,
            background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', cursor: 'pointer', backdropFilter: 'blur(5px)'
          }}
        >
          <X size={18} />
        </button>

        {/* Hero Image Section */}
        <div style={{ position: 'relative', width: '100%', height: '300px' }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.5)',
            transform: 'scale(1.1)'
          }}></div>
          
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            paddingBottom: '20px',
            background: 'linear-gradient(to top, var(--bg-color) 0%, transparent 100%)'
          }}>
            <img 
              src={image} 
              alt={title} 
              style={{
                height: '80%', maxWidth: '80%',
                objectFit: 'cover',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.1)'
              }} 
            />
          </div>
        </div>

        {/* Content Section */}
        <div style={{ padding: '0 2rem 2rem 2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 0.5rem 0', fontWeight: '800' }}>{title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: '0 0 1rem 0' }}>{subtitle}</p>
          
          {item.rating && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--accent-yellow)' }}>
              {renderStars(item.rating)}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button 
              onClick={() => { onClose(); onAddToList(item, type); }}
              className="btn-primary-premium glass"
              style={{ flex: 1, padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Plus size={18} /> Añadir a lista
            </button>
            <button 
              onClick={() => onToggleFavorite && onToggleFavorite(item, type)}
              className="glass"
              style={{ 
                padding: '0.8rem', width: '50px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                border: isFavorite ? '1px solid var(--accent-red)' : '1px solid rgba(255,255,255,0.1)',
                color: isFavorite ? 'var(--accent-red)' : 'white', borderRadius: '12px', cursor: 'pointer',
                background: isFavorite ? 'rgba(255, 59, 48, 0.1)' : 'rgba(255,255,255,0.05)'
              }}
              title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>

          {/* External Link */}
          <a 
            href={link} 
            target="_blank" rel="noopener noreferrer"
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px', 
              marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--accent-blue)', textDecoration: 'none',
              opacity: 0.8
            }}
          >
            {isMovie ? 'Ver en Letterboxd' : 'Escuchar en Spotify'} <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MediaDetailsModal;

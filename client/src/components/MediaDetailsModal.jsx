import React from 'react';
import { X, PlusCircle, Star, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MediaDetailsModal = ({ isOpen, onClose, item, type, onAddToList }) => {
  const { t } = useTranslation();
  if (!isOpen || !item) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, backdropFilter: 'blur(15px)' }}>
      <div className="modal-content glass" style={{ maxWidth: '800px', width: '90%', borderRadius: '30px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10, background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X size={20} /></button>
        
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', maxHeight: '500px' }}>
            <img src={item.poster || item.artwork} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: '2 1 400px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', margin: 0, fontWeight: '900', lineHeight: 1.1 }}>{item.title || item.name}</h2>
              <p style={{ fontSize: '1.1rem', opacity: 0.6, marginTop: '0.5rem' }}>{item.year || item.artist}</p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
              {item.rating && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary-color)' }}><Star size={16} fill="currentColor" /> {item.rating}</div>}
              {item.duration && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.7 }}><Clock size={16} /> {item.duration}</div>}
            </div>

            <p style={{ fontSize: '1rem', lineHeight: 1.6, opacity: 0.8, margin: 0 }}>
              {item.overview || item.description || t('detail.noDescription')}
            </p>

            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
              <button onClick={() => onAddToList(item, type)} className="rec-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <PlusCircle size={20} /> {t('common.addToList')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaDetailsModal;

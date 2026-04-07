import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Trash2 } from 'lucide-react';
import { listsApi, recommendationApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { MovieCard, SongCard } from '../components/Cards';
import LoadingScreen from '../components/LoadingScreen';
import MediaDetailsModal from '../components/MediaDetailsModal';

const ListView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [recommendation, setRecommendation] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    if (id) fetchList();
  }, [id]);

  const fetchList = async () => {
    try {
      const res = await listsApi.getOne(id);
      setList(res.data);
    } catch (err) {
      console.error("Error fetching list:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await listsApi.removeItem(id, itemId);
      setList({ ...list, items: list.items.filter(i => i.id !== itemId) });
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  const handleGenerateRecommendation = async () => {
    if (!list || !list.items || list.items.length === 0) return;
    setGenerating(true);
    setRecommendation(null);
    try {
      const res = await recommendationApi.generateFromList({
        items: list.items,
        listName: list.name
      });
      setRecommendation(res.data);
    } catch (err) {
      console.error("Error generating recommendation:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteList = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta lista?")) {
      try {
        await listsApi.delete(id);
        navigate('/profile');
      } catch (err) {
        console.error("Error deleting list:", err);
      }
    }
  };

  const handleCardClick = (item, type) => {
    setSelectedItem(item);
    setSelectedType(type);
    setDetailsModalOpen(true);
  };

  if (loading) return <LoadingScreen message="Cargando lista..." />;
  if (!list) return <div className="view-container">Lista no encontrada.</div>;

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={() => navigate(-1)} className="glass" style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>{list.name}</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {list.items?.length || 0} elementos
            </p>
          </div>
        </div>
        
        {user?.id === list.user_id && (
          <button 
            onClick={handleDeleteList}
            className="glass" 
            style={{ border: '1px solid rgba(255,59,48,0.3)', background: 'rgba(255,59,48,0.1)', color: '#ff3b30', borderRadius: '12px', padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Trash2 size={16} /> Eliminar Lista
          </button>
        )}
      </div>

      {/* AI Recommendation Button */}
      {list.items?.length > 0 && (
        <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button 
            onClick={handleGenerateRecommendation}
            disabled={generating}
            className="btn-primary-premium glass"
            style={{
              padding: '1rem 2rem', fontSize: '1.1rem',
              display: 'flex', alignItems: 'center', gap: '10px',
              animation: 'pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1)'
            }}
          >
            <Sparkles size={20} />
            {generating ? 'Generando Magia...' : 'Generar Recomendaciones'}
          </button>
          
          {recommendation && (
            <div className="glass" style={{ marginTop: '2rem', padding: '2rem', borderRadius: '24px', maxWidth: '800px', width: '100%', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '150px', height: '150px', background: 'var(--primary-color)', filter: 'blur(80px)', opacity: 0.3, zIndex: 0 }}></div>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} /> Recomendación Exclusiva
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', opacity: 0.7, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Película Ideal</h4>
                    <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{recommendation.pelicula}</p>
                    {recommendation.poster_url && (
                      <img src={recommendation.poster_url} alt={recommendation.pelicula} style={{ width: '100px', borderRadius: '8px', marginTop: '1rem' }} />
                    )}
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', opacity: 0.7, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Canción Ideal</h4>
                    <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 'bold' }}>{recommendation.cancion}</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,122,255,0.1)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(0,122,255,0.2)' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent-blue)' }}>El Motivo</h4>
                  <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.9 }}>{recommendation.motivo}</p>
                </div>
                
                <div style={{ marginTop: '1rem', fontStyle: 'italic', opacity: 0.7, fontSize: '0.9rem', textAlign: 'center' }}>
                  Vibra de tu lista: {recommendation.vibra}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid of Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '20px' }}>
        {list.items?.map((item, idx) => {
          // Adapt DB items (external_id, title, subtitle, image_url) to Card props
          const cardProps = {
            id: item.external_id,
            title: item.title,
            name: item.title,
            year: item.subtitle,
            artist: item.subtitle,
            poster: item.image_url,
            artwork: item.image_url,
          };

          return (
            <div key={item.id} style={{ position: 'relative' }}>
              {user?.id === list.user_id && (
                <button 
                  onClick={() => handleRemoveItem(item.id)}
                  style={{
                    position: 'absolute', top: '-10px', right: '-10px', zIndex: 10,
                    background: 'rgba(255,59,48,0.9)', color: 'white', border: 'none', borderRadius: '50%',
                    width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}
                  title="Quitar de la lista"
                >
                  <X size={14} />
                </button>
              )}
              {item.type === 'movie' ? (
                <MovieCard movie={cardProps} onClick={() => handleCardClick(cardProps, 'movie')} showRating={false} />
              ) : (
                <SongCard song={cardProps} onClick={() => handleCardClick(cardProps, 'song')} showRating={false} />
              )}
            </div>
          );
        })}
      </div>

      {list.items?.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
          Esta lista está vacía. Busca una película o canción y añádela desde su cartel.
        </div>
      )}

      <MediaDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        item={selectedItem}
        type={selectedType}
        onAddToList={() => {}} // Disabled adding to list from inside a list for now to keep it simple
      />
    </div>
  );
};

export default ListView;

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { listsApi, recommendationApi, spotifyApi } from '../api';
import {
  ArrowLeft, Trash2, X, Sparkles, Music, Film,
  ListMusic, Loader2, ExternalLink, Check, ChevronDown, ChevronUp
} from 'lucide-react';

/* ── Item card ────────────────────────────── */
const ItemCard = ({ item, canEdit, onRemove }) => {
  const isMovie = item.type === 'movie';
  const [removing, setRemoving] = useState(false);

  const handleRemove = async (e) => {
    e.stopPropagation();
    setRemoving(true);
    await onRemove(item.id);
  };

  return (
    <div className="lv-item-card">
      {/* Cover */}
      <div className="lv-item-cover">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="lv-item-img" />
        ) : (
          <div className="lv-item-placeholder">
            {isMovie ? <Film size={24} style={{ opacity: 0.3 }} /> : <Music size={24} style={{ opacity: 0.3 }} />}
          </div>
        )}
        {/* Type badge */}
        <span className={`lv-item-type-badge ${isMovie ? 'movie' : 'song'}`}>
          {isMovie ? <Film size={10} /> : <Music size={10} />}
        </span>
        {/* Remove button */}
        {canEdit && (
          <button className="lv-item-remove" onClick={handleRemove} disabled={removing} title="Quitar">
            {removing ? <Loader2 size={12} className="spin" /> : <X size={12} />}
          </button>
        )}
      </div>
      <div className="lv-item-name" title={item.title}>{item.title}</div>
      {item.subtitle && <div className="lv-item-sub">{item.subtitle}</div>}
    </div>
  );
};

/* ── Recommendation panel ─────────────────── */
const RecPanel = ({ recommendation, loading, t }) => {
  if (loading) {
    return (
      <div className="lv-rec-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
          <Loader2 size={20} className="spin" />
          <span>{t('lists.generating')}</span>
        </div>
      </div>
    );
  }
  if (!recommendation) return null;

  return (
    <div className="lv-rec-panel">
      {/* Vibe tag */}
      <div className="lv-rec-vibe">
        <Sparkles size={14} />
        <span>{t('lists.vibe')}: </span>
        <em>{recommendation.vibra}</em>
      </div>

      {/* Movie + Song cards */}
      <div className="lv-rec-cards">
        {recommendation.pelicula && (
          <div className="lv-rec-item">
            {recommendation.poster_url && (
              <img src={recommendation.poster_url} alt={recommendation.pelicula} className="lv-rec-poster" />
            )}
            <div>
              <div className="lv-rec-label">{t('lists.idealMovie')}</div>
              <div className="lv-rec-title">{recommendation.pelicula}</div>
            </div>
          </div>
        )}
        {recommendation.cancion && (
          <div className="lv-rec-item">
            <div className="lv-rec-song-icon"><Music size={20} /></div>
            <div>
              <div className="lv-rec-label">{t('lists.idealSong')}</div>
              <div className="lv-rec-title">{recommendation.cancion}</div>
            </div>
          </div>
        )}
      </div>

      {/* Reason */}
      {recommendation.motivo && (
        <div className="lv-rec-reason">
          <span className="lv-rec-label">{t('lists.why')}: </span>
          <span>{recommendation.motivo}</span>
        </div>
      )}
    </div>
  );
};

/* ── Main ListView ────────────────────────── */
const ListView = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, spotifyConnected } = useAuth();

  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI recommendation state
  const [recommendation, setRecommendation] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showRec, setShowRec] = useState(false);

  // Spotify playlist export state
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState(null); // { type: 'success'|'error', text, url }

  // Deleting state
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (id) fetchList(); }, [id]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await listsApi.getOne(id);
      setList(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRemoveItem = useCallback(async (itemId) => {
    try {
      await listsApi.removeItem(id, itemId);
      setList(prev => ({ ...prev, items: prev.items.filter(i => i.id !== itemId) }));
    } catch (err) { console.error(err); }
  }, [id]);

  const handleDeleteList = async () => {
    if (!window.confirm(t('lists.deleteConfirm'))) return;
    setDeleting(true);
    try {
      await listsApi.delete(id);
      navigate('/lists', { replace: true });
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  const handleGenerateRec = async () => {
    if (!list?.items?.length) return;
    setGenerating(true);
    setShowRec(true);
    try {
      const res = await recommendationApi.generateFromList({ items: list.items, listName: list.name });
      setRecommendation(res.data);
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  };

  const handleExportSpotify = async () => {
    const songs = list?.items?.filter(i => i.type === 'song');
    if (!songs?.length) {
      setExportMsg({ type: 'error', text: t('lists.spotifyNoSongs') });
      setTimeout(() => setExportMsg(null), 3000);
      return;
    }
    setExporting(true);
    setExportMsg(null);
    try {
      const res = await spotifyApi.createPlaylist({
        name: list.name,
        description: `Lista de ScenesBeats`,
        songs,
      });
      setExportMsg({
        type: 'success',
        text: `${t('lists.spotifySuccess')} (${res.data.tracks_added} canciones)`,
        url: res.data.playlist_url,
      });
    } catch (err) {
      setExportMsg({ type: 'error', text: t('lists.spotifyError') });
    } finally {
      setExporting(false);
    }
  };

  /* ─── States ─────── */
  if (loading) {
    return (
      <div className="view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} className="spin" style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
          <p className="stat-label">{t('lists.loading')}</p>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="view-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <ListMusic size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
        <p className="stat-label">{t('lists.notFound')}</p>
        <button className="rec-button" style={{ marginTop: '1rem' }} onClick={() => navigate('/lists')}>
          {t('lists.back')}
        </button>
      </div>
    );
  }

  const isOwner = user?.id === list.user_id;
  const movies = list.items?.filter(i => i.type === 'movie') || [];
  const songs = list.items?.filter(i => i.type === 'song') || [];
  const totalItems = list.items?.length || 0;

  return (
    <div className="view-container">
      {/* ── Top bar ── */}
      <div className="lv-topbar">
        <button className="lv-back-btn" onClick={() => navigate('/lists')}>
          <ArrowLeft size={20} />
        </button>
        <div className="lv-topbar-title">
          <h1 className="lv-list-name">{list.name}</h1>
          <div className="lv-list-meta">
            {movies.length > 0 && <span className="lv-meta-pill movie"><Film size={11} /> {movies.length}</span>}
            {songs.length > 0 && <span className="lv-meta-pill song"><Music size={11} /> {songs.length}</span>}
          </div>
        </div>
        {isOwner && (
          <button className="lv-delete-btn" onClick={handleDeleteList} disabled={deleting} title="Eliminar lista">
            {deleting ? <Loader2 size={18} className="spin" /> : <Trash2 size={18} />}
          </button>
        )}
      </div>

      {/* ── Action buttons ── */}
      {totalItems > 0 && (
        <div className="lv-actions">
          <button className="lv-action-btn rec-btn" onClick={handleGenerateRec} disabled={generating}>
            <Sparkles size={16} />
            {generating ? t('lists.generating') : t('lists.getRec')}
          </button>
          {spotifyConnected && (
            <button className="lv-action-btn spotify-btn" onClick={handleExportSpotify} disabled={exporting}>
              {exporting ? <Loader2 size={16} className="spin" /> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              )}
              {t('lists.spotifyPlaylist')}
            </button>
          )}
        </div>
      )}

      {/* ── Export message ── */}
      {exportMsg && (
        <div className={`lv-export-msg ${exportMsg.type}`}>
          {exportMsg.type === 'success' ? <Check size={16} /> : <X size={16} />}
          <span>{exportMsg.text}</span>
          {exportMsg.url && (
            <a href={exportMsg.url} target="_blank" rel="noopener noreferrer" className="lv-spotify-link">
              <ExternalLink size={14} /> Abrir en Spotify
            </a>
          )}
        </div>
      )}

      {/* ── AI Recommendation panel ── */}
      {showRec && (
        <div style={{ marginBottom: '2rem' }}>
          <button
            className="lv-rec-toggle"
            onClick={() => setShowRec(!showRec)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.9rem', padding: '0.5rem 0', marginBottom: '0.75rem' }}
          >
            <Sparkles size={16} />
            {t('lists.recTitle')}
            {showRec ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <RecPanel recommendation={recommendation} loading={generating} t={t} />
        </div>
      )}

      {/* ── Empty state ── */}
      {totalItems === 0 && (
        <div className="lists-empty" style={{ marginTop: '2rem' }}>
          <ListMusic size={40} style={{ opacity: 0.25 }} />
          <p className="lists-empty-text">{t('list.empty')}</p>
        </div>
      )}

      {/* ── Movies section ── */}
      {movies.length > 0 && (
        <section className="feed-section">
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Film size={18} /> Películas <span className="lv-count-badge">{movies.length}</span>
          </h2>
          <div className="lv-items-grid">
            {movies.map(item => (
              <ItemCard key={item.id} item={item} canEdit={isOwner} onRemove={handleRemoveItem} />
            ))}
          </div>
        </section>
      )}

      {/* ── Songs section ── */}
      {songs.length > 0 && (
        <section className="feed-section" style={{ marginTop: movies.length > 0 ? '2.5rem' : 0 }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Music size={18} /> Canciones <span className="lv-count-badge">{songs.length}</span>
          </h2>
          <div className="lv-items-grid">
            {songs.map(item => (
              <ItemCard key={item.id} item={item} canEdit={isOwner} onRemove={handleRemoveItem} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ListView;

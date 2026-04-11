import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { listsApi, recommendationApi, spotifyApi, movieApi, nodeApi, socialApi } from '../api';
import LoadingDots from '../components/LoadingDots';
import {
  ArrowLeft, Trash2, X, Sparkles, Music, Film,
  ListMusic, ExternalLink, Check, ChevronDown, ChevronUp, Search, Plus,
  Users, UserPlus, Wand2, Share2, Loader2, Info
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
      <div className="lv-item-cover">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="lv-item-img" />
        ) : (
          <div className="lv-item-placeholder">
            {isMovie ? <Film size={24} style={{ opacity: 0.3 }} /> : <Music size={24} style={{ opacity: 0.3 }} />}
          </div>
        )}
        <span className={`lv-item-type-badge ${isMovie ? 'movie' : 'song'}`}>
          {isMovie ? <Film size={10} /> : <Music size={10} />}
        </span>
        {canEdit && (
          <button className="lv-item-remove" onClick={handleRemove} disabled={removing} title={t('lists.removeItem')}>
            {removing ? <LoadingDots className="mini-loader" /> : <X size={12} />}
          </button>
        )}
      </div>
      <div className="lv-item-name" title={item.title}>{item.title}</div>
      {item.subtitle && <div className="lv-item-sub">{item.subtitle}</div>}
    </div>
  );
};

/* ── Collaboration Modal ─────────────────── */
const CollabModal = ({ isOpen, onClose, friends, collaborators, onAdd, onRemove, t }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Users size={20} className="icon-spotify" />
            <h2 className="modal-title">{t('lists.collaborators') || 'Colaboradores'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <p className="lv-ai-sub" style={{ marginBottom: '1.5rem' }}>
            {t('lists.collabInvite') || 'Invita a tus amigos para que puedan editar esta lista contigo.'}
          </p>
          
          <div className="modal-lists-container">
            {friends.length === 0 && <p className="text-center py-4 opacity-50">{t('social.noFriends')}</p>}
            {friends.map(friend => {
              const isCollab = collaborators.some(c => c.id === friend.id);
              return (
                <div key={friend.id} className={`modal-list-item ${isCollab ? 'success' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={friend.avatar || '/placeholder-u.png'} 
                      className="lv-author-avatar" 
                      alt="" 
                      onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-u.png'; }}
                    />
                    <span className="list-name">{friend.name}</span>
                  </div>
                  {isCollab ? (
                    <button className="lv-item-remove" onClick={() => onRemove(friend.id)} style={{ position: 'static' }}>
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <button className="lv-ai-add-btn" onClick={() => onAdd(friend.id)}>
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Magic Complete Drawer ────────────────── */
const MagicDrawer = ({ allResults, visibleRecs, onAdd, onClose, loading, t }) => {
  if (!allResults && !loading) return null;

  const handleAdd = async (rec, idx) => {
    await onAdd(rec, idx);
  };

  return (
    <div className="lv-ai-drawer">
      <div className="lv-ai-header">
        <div className="lv-ai-badge">
          <Wand2 size={16} />
          <span>{t('lists.magicComplete')}</span>
        </div>
        <button className="modal-close" onClick={onClose}><X size={18} /></button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '150px' }}>
          <LoadingDots />
        </div>
      ) : (
        <>
          {allResults?.vibra && (
            <p className="lv-ai-vibra">{allResults.vibra}</p>
          )}
          <div className="lv-ai-results">
            {visibleRecs.map((rec, i) => (
              <div key={rec._poolIdx} className="lv-ai-rec-card animate-fadeIn">
                <img src={rec.image_url || '/placeholder.png'} className="lv-ai-img" alt="" />
                <div className="lv-ai-info">
                  <span className={`lv-ai-type-badge ${rec.tipo}`}>
                    {rec.tipo === 'movie' ? <Film size={10} /> : <Music size={10} />}
                  </span>
                  <div className="lv-ai-title">{rec.titulo}</div>
                  <div className="lv-ai-sub">{rec.subtitulo}</div>
                  <div className="lv-ai-motivo">{rec.motivo}</div>
                </div>
                <button
                  className={`lv-ai-add-btn ${rec._added ? 'added' : ''}`}
                  onClick={() => handleAdd(rec, i)}
                  disabled={rec._added}
                  title={rec._added ? 'Ya añadido' : 'Añadir a la lista'}
                >
                  {rec._added ? <Check size={16} /> : <Plus size={16} />}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Main ListView ────────────────────────── */
const ListView = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, spotifyConnected } = useAuth();

  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI & Magic states
  const [magicResults, setMagicResults] = useState(null);    // full API response
  const [visibleRecs, setVisibleRecs] = useState([]);         // what's shown (up to 6)
  const [recPool, setRecPool] = useState([]);                 // reserve pool for replacements
  const [completing, setCompleting] = useState(false);
  const [showMagic, setShowMagic] = useState(false);

  // Collab states
  const [friends, setFriends] = useState([]);
  const [showCollabModal, setShowCollabModal] = useState(false);

  // Export & Misc
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Quick search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchType, setSearchType] = useState('movie');

  useEffect(() => { if (id) fetchList(); }, [id]);
  useEffect(() => { if (user) fetchFriends(); }, [user]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await listsApi.getOne(id);
      setList(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchFriends = async () => {
    try {
      const res = await socialApi.getFriends(user.id);
      setFriends(res.data);
    } catch (err) { console.error(err); }
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

  const handleMagicComplete = async () => {
    if (!list?.items?.length) return;
    setCompleting(true);
    setShowMagic(true);
    setVisibleRecs([]);
    setRecPool([]);
    try {
      const res = await recommendationApi.completeList({ 
        items: list.items, 
        listName: list.name,
        lang: i18n.language,
        userId: user?.id
      });
      const data = res.data;
      setMagicResults(data);
      // Tag each rec with a stable pool index and assign first 6 as visible
      const tagged = (data.recomendaciones || []).map((r, i) => ({ ...r, _poolIdx: i, _added: false }));
      setVisibleRecs(tagged.slice(0, 6));
      setRecPool(tagged.slice(6));
    } catch (err) { console.error(err); }
    finally { setCompleting(false); }
  };

  const handleAddItem = async (item, poolIdx) => {
    try {
      const payload = {
        external_id: String(item.id || item.external_id),
        title: item.title || item.name || item.titulo,
        subtitle: item.subtitle || item.year || item.artist || item.subtitulo,
        image_url: item.image_url || item.poster || item.artwork,
        type: item.type || item.tipo || searchType
      };
      const res = await listsApi.addItem(id, payload);
      setList(prev => ({ ...prev, items: [...(prev.items || []), res.data] }));
      
      // If poolIdx is defined, replace this card with next from pool
      if (poolIdx !== undefined) {
        setVisibleRecs(prev => {
          const next = [...prev];
          if (recPool.length > 0) {
            // Replace with next from pool
            const [nextRec, ...restPool] = recPool;
            setRecPool(restPool);
            next[poolIdx] = nextRec;
          } else {
            // Mark as added (no replacement available)
            next[poolIdx] = { ...next[poolIdx], _added: true };
          }
          return next;
        });
      }

      // If added from search, clear
      if (searchQuery) setSearchQuery('');
      if (searchResults.length) setSearchResults([]);
    } catch (err) {
      if (err.response?.status === 409) alert(t('lists.alreadyInList'));
      else console.error('Add item error:', err);
    }
  };

  const handleAddCollab = async (uId) => {
    try {
      await listsApi.addCollaborator(id, uId);
      // Refresh list to see new collab
      const res = await listsApi.getOne(id);
      setList(res.data);
    } catch (err) { console.error(err); }
  };

  const handleRemoveCollab = async (uId) => {
    try {
      await listsApi.removeCollaborator(id, uId);
      const res = await listsApi.getOne(id);
      setList(res.data);
    } catch (err) { console.error(err); }
  };

  const handleQuickSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      if (searchType === 'movie') {
        const res = await movieApi.search(query);
        setSearchResults(res.data);
      } else {
        const spotifyRes = await nodeApi.get(`/spotify/search?query=${query}&type=track`);
        const tracks = spotifyRes.data.tracks.items.map(t => ({
          id: t.id,
          title: t.name,
          subtitle: t.artists[0].name,
          image_url: t.album.images[0]?.url,
          type: 'song'
        }));
        setSearchResults(tracks);
      }
    } catch (err) { console.error(err); }
    finally { setSearching(false); }
  };

  const handleExportSpotify = async () => {
    const songs = list?.items?.filter(i => i.type === 'song');
    if (!songs?.length) {
      setExportMsg({ type: 'error', text: t('lists.spotifyNoSongs') });
      setTimeout(() => setExportMsg(null), 3000);
      return;
    }
    setExporting(true);
    try {
      const res = await spotifyApi.createPlaylist({ name: list.name, songs });
      setExportMsg({ type: 'success', text: t('lists.spotifySuccess'), url: res.data.playlist_url });
    } catch (err) { setExportMsg({ type: 'error', text: t('lists.spotifyError') }); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="flex-center"><LoadingDots /></div>;
  if (!list) return <div className="view-container text-center pt-16"><p>{t('lists.notFound')}</p></div>;

  const isOwner = user?.id === list.user_id;
  const isCollaborator = list.collaborators?.some(c => c.id === user?.id);
  const canEdit = isOwner || isCollaborator;
  
  const movies = list.items?.filter(i => i.type === 'movie') || [];
  const songs = list.items?.filter(i => i.type === 'song') || [];
  const firstMovie = movies[0];

  return (
    <div className="lv-premium-container">
      {/* ── HERO HEADER ── */}
      <header className="lv-hero-header">
        <div className="lv-header-backdrop">
          <img src={list.cover_image_url || firstMovie?.image_url || '/placeholder.png'} className="lv-backdrop-img" alt="" />
          <div className="lv-backdrop-overlay" />
        </div>

        <div className="lv-header-content">
          <img src={list.cover_image_url || firstMovie?.image_url || '/placeholder.png'} className="lv-main-cover animate-fadeIn" alt="" />
          
          <div className="lv-info-pane">
            <h1 className="lv-name-h1">{list.name}</h1>
            <div className="lv-people-group">
              <div className="lv-avatars-stack">
                {(() => {
                  const ownerAvatar = isOwner ? (user?.avatar || user?.image || list.user?.avatar) : list.user?.avatar;
                  const ownerName = isOwner ? (user?.name || list.user?.name) : list.user?.name;
                  return (
                    <img 
                      src={ownerAvatar || '/placeholder-u.png'} 
                      className="lv-author-avatar-main" 
                      alt={ownerName} 
                      title={`${t('lists.by')} ${ownerName}`} 
                      onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-u.png'; }}
                    />
                  );
                })()}
                {list.collaborators?.map(collab => {
                  const isCollabUser = collab.id === user?.id;
                  const collabAvatar = isCollabUser ? (user?.avatar || user?.image || collab.avatar) : collab.avatar;
                  const collabName = isCollabUser ? (user?.name || collab.name) : collab.name;
                  return (
                    <img 
                      key={collab.id} 
                      src={collabAvatar || '/placeholder-u.png'} 
                      className="lv-collab-avatar-item" 
                      alt={collabName} 
                      title={collabName} 
                      onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder-u.png'; }}
                    />
                  );
                })}
                {isOwner && (
                  <button className="lv-add-collab-btn" onClick={() => setShowCollabModal(true)} title={t('lists.addCollaborators')}>
                    <UserPlus size={14} />
                  </button>
                )}
              </div>
              <div className="lv-people-text">
                <span className="lv-author-name">{isOwner ? (user?.name || list.user?.name) : list.user?.name}</span>
                {list.collaborators?.length > 0 && (
                  <span className="lv-collab-count">
                    + {list.collaborators.length} {t('lists.collaboratorsCount') || 'colaboradores'}
                  </span>
                )}
              </div>
            </div>

            {list.description && <p className="lv-desc-text">{list.description}</p>}
          </div>
        </div>

        {/* Back button */}
        <button className="lv-back-btn" onClick={() => navigate('/lists')} style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 100 }}>
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* ── ACTION BUTTONS ── */}
      <div className="lv-premium-actions">
        {canEdit && (
          <button className="lv-prime-btn magic" onClick={handleMagicComplete} disabled={completing}>
            {completing ? <Loader2 size={18} className="spin" /> : <Wand2 size={18} />}
            {t('lists.magicComplete') || 'Completar con IA'}
          </button>
        )}
        {spotifyConnected && songs.length > 0 && (
          <button className="lv-prime-btn secondary" onClick={handleExportSpotify} disabled={exporting}>
            {exporting ? <Loader2 size={18} className="spin" /> : <Share2 size={18} />}
            Spotify
          </button>
        )}
        {isOwner && (
          <button className="lv-prime-btn secondary" onClick={handleDeleteList} disabled={deleting} title={t('common.delete')}>
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="lv-content-section">
        {/* Magic Drawer */}
        {showMagic && (
          <MagicDrawer 
            allResults={magicResults}
            visibleRecs={visibleRecs}
            loading={completing} 
            onClose={() => setShowMagic(false)} 
            onAdd={handleAddItem}
            t={t}
          />
        )}

        {/* Export Message */}
        {exportMsg && (
          <div className={`lv-export-msg ${exportMsg.type}`} style={{ marginBottom: '2rem' }}>
            {exportMsg.type === 'success' ? <Check size={16} /> : <X size={16} />}
            <span>{exportMsg.text}</span>
            {exportMsg.url && <a href={exportMsg.url} target="_blank" className="lv-spotify-link" rel="noreferrer"><ExternalLink size={14} /> {t('common.open')}</a>}
          </div>
        )}

        {/* Search / Add */}
        {canEdit && (
          <div className="lv-quick-add" style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', marginBottom: '3rem' }}>
            <div className="lv-search-controls">
              <div className="lv-search-input-box">
                <Search size={18} className="lv-search-icon" />
                <input
                  type="text"
                  className="lv-search-input"
                  placeholder={searchType === 'movie' ? t('search.placeholderMovie') : t('search.placeholderSong')}
                  value={searchQuery}
                  onChange={handleQuickSearch}
                />
                {searching && <LoadingDots className="mini-loader lv-search-loader" />}
              </div>
              <div className="lv-search-type-toggle">
                <button className={`type-btn ${searchType === 'movie' ? 'active' : ''}`} onClick={() => setSearchType('movie')}><Film size={14} /></button>
                <button className={`type-btn ${searchType === 'song' ? 'active' : ''}`} onClick={() => setSearchType('song')}><Music size={14} /></button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="lv-quick-results">
                {searchResults.map((res, idx) => (
                  <div key={res.id + idx} className="lv-quick-result-item" onClick={() => handleAddItem(res)}>
                    <img src={res.image_url || res.poster || res.artwork} alt="" className="qr-img" />
                    <div className="qr-info">
                      <div className="qr-title">{res.title || res.name}</div>
                      <div className="qr-sub">{res.subtitle || res.year || res.artist}</div>
                    </div>
                    <Plus size={18} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Items Grid */}
        <section className="feed-section">
          {movies.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 className="section-title"><Film size={18} /> {t('lists.movies')}</h2>
              <div className="lv-items-grid">
                {movies.map(item => (
                  <ItemCard key={item.id} item={item} canEdit={canEdit} onRemove={handleRemoveItem} />
                ))}
              </div>
            </div>
          )}

          {songs.length > 0 && (
            <div>
              <h2 className="section-title"><Music size={18} /> {t('lists.songs')}</h2>
              <div className="lv-items-grid">
                {songs.map(item => (
                  <ItemCard key={item.id} item={item} canEdit={canEdit} onRemove={handleRemoveItem} />
                ))}
              </div>
            </div>
          )}

          {list.items?.length === 0 && (
            <div className="flex-center opacity-30 flex-col gap-4">
              <ListMusic size={64} />
              <p>{t('lists.empty') || 'Esta lista aún no tiene contenido.'}</p>
            </div>
          )}
        </section>
      </div>

      <CollabModal 
        isOpen={showCollabModal} 
        onClose={() => setShowCollabModal(false)}
        friends={friends}
        collaborators={list.collaborators || []}
        onAdd={handleAddCollab}
        onRemove={handleRemoveCollab}
        t={t}
      />
    </div>
  );
};

export default ListView;

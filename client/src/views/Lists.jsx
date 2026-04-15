import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { listsApi } from '../api';
import {
  Plus, ListMusic, Film, Music,
  ChevronRight, Trash2, X, Check
} from 'lucide-react';
import LoadingDots from '../components/LoadingDots';
import { socket } from '../App';

/* ── Create-list inline form ─────────────────── */
const CreateListModal = ({ onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = React.useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ListMusic size={20} style={{ color: 'var(--primary-color)' }} />
            <h3 className="modal-title">{t('lists.newList')}</h3>
          </div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-input-group" style={{ marginBottom: '1.5rem' }}>
            <input
              ref={inputRef}
              type="text"
              className="modal-input"
              placeholder={t('lists.placeholder')}
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ padding: '0.875rem 1rem' }}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="modal-btn-cancel" onClick={onClose}>
              {t('profile.cancel')}
            </button>
            <button type="submit" className="modal-btn-save" disabled={loading || !name.trim()}>
              {loading ? <LoadingDots className="mini-loader" /> : <Check size={16} />}
              {loading ? '...' : t('lists.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── List card ──────────────────────────── */
const ListCard = ({ list, onDelete, onClick }) => {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const movieCount = list.items?.filter(i => i.type === 'movie').length || 0;
  const songCount = list.items?.filter(i => i.type === 'song').length || 0;
  const totalCount = list.items?.length || 0;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(t('lists.deleteConfirm'))) return;
    setDeleting(true);
    await onDelete(list.id);
  };

  // Pick cover: first item image, or gradient placeholder
  const cover = list.cover_image_url || list.items?.[0]?.image_url;

  // Fallback: use default placeholder image
  const fallbackImg = '/titulo.png';

  return (
    <div className="list-card" onClick={onClick}>
      {/* Cover */}
      <div className="list-card-cover">
        {cover ? (
          <img src={cover} alt={list.name} className="list-card-img" />
        ) : (
          <img src={fallbackImg} alt="" className="list-card-img" />
        )}
        {/* Badges for multiple covers */}
        {list.items?.length > 1 && (
          <div className="list-card-cover-stack">
            {list.items.slice(1, 3).map((item, i) => (
              item.image_url && (
                <img
                  key={i}
                  src={item.image_url}
                  alt=""
                  className="list-card-stack-img"
                  style={{ right: `${(i + 1) * 18}px`, zIndex: 2 - i }}
                />
              )
            ))}
          </div>
        )}
        {/* Delete button */}
        <button
          className="list-card-delete"
          onClick={handleDelete}
          disabled={deleting}
          title={t('list.deleteBtn')}
        >
          {deleting ? <LoadingDots className="mini-loader" /> : <Trash2 size={14} />}
        </button>
      </div>

      {/* Info */}
      <div className="list-card-info">
        <h3 className="list-card-name">{list.name}</h3>
        <div className="list-card-meta">
          {movieCount > 0 && (
            <span className="list-card-tag"><Film size={11} /> {movieCount}</span>
          )}
          {songCount > 0 && (
            <span className="list-card-tag"><Music size={11} /> {songCount}</span>
          )}
          {totalCount === 0 && (
            <span className="list-card-tag" style={{ opacity: 0.5 }}>{t('list.vacía')}</span>
          )}
        </div>
      </div>

      <ChevronRight size={16} className="list-card-arrow" />
    </div>
  );
};

/* ── Skeleton placeholder ────────────────── */
const ListSkeleton = () => (
  <div className="list-card" style={{ pointerEvents: 'none' }}>
    <div className="list-card-cover">
      <div className="list-card-placeholder skeleton-pulse" />
    </div>
    <div className="list-card-info">
      <div className="skeleton-pulse" style={{ height: 16, width: '60%', borderRadius: 8, marginBottom: 8 }} />
      <div className="skeleton-pulse" style={{ height: 12, width: '40%', borderRadius: 6 }} />
    </div>
  </div>
);

/* ── Main Lists view ────────────────────── */
const Lists = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await listsApi.getAll(user.id);
      setLists(res.data || []);
    } catch (err) {
      console.error('Failed to fetch lists:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  // Real-time: listen for new lists or deletions
  useEffect(() => {
    const handleNewList = (data) => {
      if (data.user_id === user?.id) return;
      fetchLists();
    };

    const handleListDeleted = (data) => {
      setLists(prev => prev.filter(l => l.id !== data.list_id));
    };

    socket.on('list_created', handleNewList);
    socket.on('list_deleted', handleListDeleted);

    return () => {
      socket.off('list_created', handleNewList);
      socket.off('list_deleted', handleListDeleted);
    };
  }, [user?.id]);

  const handleCreate = async (name) => {
    try {
      const res = await listsApi.create({
        user_id: user.id,
        name,
        description: '',
        is_public: true,
      });
      setLists(prev => [res.data, ...prev]);
    } catch (err) {
      console.error('Failed to create list:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await listsApi.delete(id);
      setLists(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete list:', err);
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="lists-header">
        <h2 className="section-title" style={{ marginBottom: 0 }}>{t('lists.title')}</h2>
        <button className="lists-new-btn" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          {t('lists.newList')}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="lists-grid">
          {[...Array(4)].map((_, i) => <ListSkeleton key={i} />)}
        </div>
      ) : lists.length === 0 ? (
        <div className="lists-empty">
          <div className="lists-empty-icon">
            <ListMusic size={48} style={{ opacity: 0.3 }} />
          </div>
          <p className="lists-empty-text">{t('lists.empty')}</p>
        </div>
      ) : (
        <div className="lists-grid">
          {lists.map(list => (
            <ListCard
              key={list.id}
              list={list}
              onDelete={handleDelete}
              onClick={() => navigate(`/list/${list.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateListModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
};

export default Lists;

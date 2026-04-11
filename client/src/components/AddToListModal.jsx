import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { listsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { X, ListPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import LoadingDots from './LoadingDots';

const AddToListModal = ({ item, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingTo, setAddingTo] = useState(null); // ID of list being added to
  const [status, setStatus] = useState({ listId: null, type: null, msg: '' }); // { listId, type: 'success'|'error', msg }

  useEffect(() => {
    const fetchLists = async () => {
      if (!user) return;
      try {
        const res = await listsApi.getAll(user.id);
        setLists(res.data);
      } catch (err) {
        console.error('Fetch lists error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLists();
  }, [user]);

  const handleAdd = async (listId) => {
    setAddingTo(listId);
    setStatus({ listId: null, type: null, msg: '' });
    try {
      await listsApi.addItem(listId, {
        external_id: String(item.id),
        title: item.title,
        subtitle: item.subtitle,
        image_url: item.image_url,
        type: item.type
      });
      setStatus({ listId, type: 'success', msg: t('common.addedSuccess') });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      console.error('Add to list error:', err);
      setStatus({ listId, type: 'error', msg: t('common.addError') });
    } finally {
      setAddingTo(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <ListPlus className="modal-icon" size={20} />
            <h2 className="modal-title">{t('common.addToList')}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-item-preview">
            <img src={item.image_url} alt={item.title} className="preview-img" />
            <div className="preview-info">
              <div className="preview-title">{item.title}</div>
              <div className="preview-sub">{item.subtitle}</div>
            </div>
          </div>

          <div className="modal-lists-container">
            {loading ? (
              <div className="flex-center p-4">
                <LoadingDots />
              </div>
            ) : lists.length > 0 ? (
              lists.map(list => (
                <button 
                  key={list.id} 
                  className={`modal-list-item ${status.listId === list.id ? status.type : ''}`}
                  onClick={() => handleAdd(list.id)}
                  disabled={addingTo !== null}
                >
                  <span className="list-name">{list.name}</span>
                  <div className="list-action">
                    {addingTo === list.id ? (
                      <LoadingDots className="mini-loader" />
                    ) : status.listId === list.id ? (
                      status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />
                    ) : (
                      <PlusIcon size={16} />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <p className="stat-label text-center p-4">{t('lists.noLists')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlusIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default AddToListModal;

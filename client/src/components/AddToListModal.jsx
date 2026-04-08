import React, { useState, useEffect } from 'react';
import { X, Plus, List as ListIcon, Loader, CheckCircle } from 'lucide-react';
import { listsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const AddToListModal = ({ isOpen, onClose, originalItem, type }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchLists();
      setStatusMsg('');
      setNewListName('');
    }
  }, [isOpen, user]);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await listsApi.getAll(user.id);
      setLists(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const res = await listsApi.create({
        user_id: user.id, name: newListName.trim(), description: '', is_public: true
      });
      setLists([...lists, res.data]);
      setNewListName('');
      if (originalItem) await handleAddToList(res.data.id, res.data.name);
    } catch (err) { showStatus("Error", "error"); }
    finally { setCreating(false); }
  };

  const handleAddToList = async (listId, listName) => {
    if (!originalItem) return;
    try {
      const payload = {
        type: type, external_id: String(originalItem.id),
        title: originalItem.title || originalItem.name,
        subtitle: originalItem.year || originalItem.artist || '',
        image_url: originalItem.poster || originalItem.artwork
      };
      await listsApi.addItem(listId, payload);
      showStatus(`${listName} OK`, "success");
      setTimeout(() => onClose(), 1500);
    } catch (err) { showStatus("Error", "error"); }
  };

  const showStatus = (msg, type) => {
    setStatusMsg(msg); setStatusType(type);
    setTimeout(() => { if (isOpen) setStatusMsg(''); }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, backdropFilter: 'blur(5px)' }}>
      <div className="modal-content glass" style={{ maxWidth: '400px', width: '90%', padding: '1.5rem', borderRadius: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListIcon size={20} color="var(--primary-color)" /> {t('profile.myLists')}
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {statusMsg && (
          <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '1rem', background: statusType === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)', color: statusType === 'success' ? '#34c759' : '#ff3b30' }}>
            {statusMsg}
          </div>
        )}

        <form onSubmit={handleCreateList} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <input type="text" placeholder={t('profile.newList')} value={newListName} onChange={(e) => setNewListName(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }} />
          <button type="submit" disabled={creating} style={{ padding: '0 15px', borderRadius: '12px', background: 'var(--primary-color)', border: 'none' }}>{creating ? '...' : <Plus size={18} />}</button>
        </form>

        <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? <Loader className="spin" size={24} style={{ margin: '0 auto' }} /> : lists.map(list => (
            <div key={list.id} onClick={() => handleAddToList(list.id, list.name)} className="glass" style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{list.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{list.items?.length || 0} items</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AddToListModal;

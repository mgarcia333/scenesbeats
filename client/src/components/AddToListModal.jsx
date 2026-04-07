import React, { useState, useEffect } from 'react';
import { X, Plus, List as ListIcon, Loader, CheckCircle } from 'lucide-react';
import { listsApi } from '../api';
import { useAuth } from '../context/AuthContext';

const AddToListModal = ({ isOpen, onClose, originalItem, type }) => {
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState(''); // 'success' or 'error'

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
    } catch (err) {
      console.error("Error fetching lists", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const res = await listsApi.create({
        user_id: user.id,
        name: newListName.trim(),
        description: '',
        is_public: true
      });
      setLists([...lists, res.data]);
      setNewListName('');
      // Auto-add item to the newly created list
      await handleAddToList(res.data.id, res.data.name);
    } catch (err) {
      console.error("Error creating list", err);
      showStatus("Error al crear la lista", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleAddToList = async (listId, listName) => {
    try {
      const payload = {
        type: type,
        external_id: String(originalItem.id),
        title: originalItem.title || originalItem.name,
        subtitle: originalItem.year || originalItem.artist || '',
        image_url: originalItem.poster || originalItem.artwork
      };
      await listsApi.addItem(listId, payload);
      showStatus(`Añadido a "${listName}" correctamente`, "success");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      if (err.response?.status === 409) {
        showStatus(`Ya está en "${listName}"`, "error");
      } else {
        console.error("Error adding to list", err);
        showStatus("Error al añadir a la lista", "error");
      }
    }
  };

  const showStatus = (msg, type) => {
    setStatusMsg(msg);
    setStatusType(type);
    setTimeout(() => { if (isOpen) setStatusMsg(''); }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100, backdropFilter: 'blur(5px)' }}>
      <div className="modal-content glass" style={{
        maxWidth: '400px', width: '90%', padding: '1.5rem',
        borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListIcon size={20} color="var(--primary-color)" /> Añadir a Lista
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div style={{
            padding: '10px', borderRadius: '8px', marginBottom: '1rem',
            background: statusType === 'success' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)',
            color: statusType === 'success' ? '#34c759' : '#ff3b30',
            border: `1px solid ${statusType === 'success' ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 59, 48, 0.2)'}`,
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem'
          }}>
            {statusType === 'success' && <CheckCircle size={16} />}
            {statusMsg}
          </div>
        )}

        {/* Create new list form */}
        <form onSubmit={handleCreateList} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Crear nueva lista..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            style={{
              flex: 1, padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255, 255, 255, 0.05)', color: 'white', outline: 'none'
            }}
          />
          <button 
            type="submit" 
            disabled={creating || !newListName.trim()}
            style={{
              padding: '0 15px', borderRadius: '12px', background: 'var(--primary-color)', color: 'white',
              border: 'none', cursor: newListName.trim() ? 'pointer' : 'not-allowed', opacity: newListName.trim() ? 1 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {creating ? <Loader size={18} className="spin" /> : <Plus size={18} />}
          </button>
        </form>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Tus Listas
        </div>

        {/* Lists Container */}
        <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
              <Loader className="spin" size={24} style={{ margin: '0 auto' }} />
            </div>
          ) : lists.length > 0 ? (
            lists.map(list => (
              <div 
                key={list.id}
                onClick={() => handleAddToList(list.id, list.name)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', marginRight: '12px',
                  background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {list.cover_image_url ? (
                    <img src={list.cover_image_url} alt={list.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <ListIcon size={18} opacity={0.5} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{list.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {list.items ? list.items.length : 0} elementos
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No tienes listas todavía. ¡Crea una arriba!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToListModal;

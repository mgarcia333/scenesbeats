import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { socialApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, Check, Clock, Film, Music, 
  ChevronLeft, Star, List as ListIcon 
} from 'lucide-react';
import HorizontalScroll from '../components/HorizontalScroll';
import { socket } from '../App';

const UserProfile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none'); // none, pending, accepted
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await socialApi.getUserProfile(id);
      setProfileUser(response.data);
      
      // Check friendship status
      const friendsRes = await socialApi.getFriends(currentUser.id);
      const isFriend = friendsRes.data.some(f => String(f.id) === String(id));
      
      if (isFriend) {
        setFriendStatus('accepted');
      } else {
        const pendingRes = await socialApi.getPendingRequests(currentUser.id);
        const sentPending = pendingRes.data.some(r => String(r.recipient_id) === String(id));
        if (sentPending) setFriendStatus('pending');
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    setLoadingAction(true);
    try {
      await socialApi.sendRequest({
        sender_id: currentUser.id,
        recipient_id: id
      });
      // Emit socket event
      socket.emit('friend_request', {
        from: currentUser.name,
        toId: id
      });
      setFriendStatus('pending');
    } catch (err) {
      console.error("Error sending friend request:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="loader spin"></div></div>;
  if (!profileUser) return <div className="view-container">{t('profile.userNotFound')}</div>;

  return (
    <div className="view-container animate-fadeIn">
      <button className="lv-back-btn" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        <ChevronLeft size={20} />
      </button>

      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <img 
            src={profileUser.avatar || `https://ui-avatars.com/api/?name=${profileUser.name}`} 
            alt="" 
            className="profile-avatar-large" 
          />
        </div>

        <div className="profile-info-main">
          <h2 className="profile-name-large">{profileUser.name}</h2>
          <p className="hero-subtitle">{profileUser.email}</p>

          <div className="profile-actions-row" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            {friendStatus === 'accepted' ? (
              <div className="status-badge">
                <Check size={16} /> <span>{t('common.friends')}</span>
              </div>
            ) : friendStatus === 'pending' ? (
              <div className="status-badge pending">
                <Clock size={16} /> <span>{t('social.pending')}</span>
              </div>
            ) : (
              <button 
                className="btn-primary-solid" 
                onClick={handleAddFriend}
                disabled={loadingAction}
                style={{ padding: '0.5rem 1.5rem', height: '40px' }}
              >
                {loadingAction ? <div className="loader-xs"></div> : <UserPlus size={18} />}
                <span>{t('social.addFriend')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <section className="feed-section" style={{ marginTop: '3rem' }}>
        <h2 className="section-title">{t('profile.publicLists')} ({profileUser.lists?.length || 0})</h2>
        {profileUser.lists && profileUser.lists.length > 0 ? (
          <HorizontalScroll>
            {profileUser.lists.map(list => (
              <div 
                key={list.id} 
                className="activity-card" 
                style={{ flex: '0 0 200px', cursor: 'pointer' }}
                onClick={() => navigate(`/list/${list.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ListIcon size={16} color="var(--primary-color)" />
                  <span className="small font-bold">{list.name}</span>
                </div>
                <div className="text-muted small">
                  {list.items_count || 0} {t('list.elements')}
                </div>
              </div>
            ))}
          </HorizontalScroll>
        ) : (
          <p className="text-muted small">{t('profile.noPublicLists')}</p>
        )}
      </section>

      <section className="feed-section" style={{ marginTop: '3rem' }}>
        <h2 className="section-title">{t('profile.connections')}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {profileUser.spotify_id && (
            <div className="connection-badge connected">
              <Music size={14} /> <span>Spotify</span>
            </div>
          )}
          {profileUser.letterboxd_username && (
            <div className="connection-badge connected lb">
              <Film size={14} /> <span>Letterboxd</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UserProfile;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { socialApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserPlus, Check, X, Clock, MessageSquare, 
  Heart, Sparkles, Film, Music, List as ListIcon 
} from 'lucide-react';

import LoadingDots from '../components/LoadingDots';
import { socket } from '../App';

const ActivityCard = ({ activity }) => {
  const { t } = useTranslation();
  const { user, type, data, created_at } = activity;
  const date = new Date(created_at).toLocaleDateString();

  let content = null;
  switch (type) {
    case 'list_created':
      content = (
        <>
          <span>{t('community.createdList')} </span>
          <strong className="activity-subject">{data.list_name}</strong>
        </>
      );
      break;
    case 'friend_added':
      content = (
        <>
          <span>{t('community.addedFriend')} </span>
          <strong className="activity-subject">{data.friend_name}</strong>
        </>
      );
      break;
    case 'rec_generated':
      content = (
        <>
          <span>{t('community.genRec')} </span>
          <strong className="activity-subject">{data.list_name}</strong>
        </>
      );
      break;
    default:
      content = <span>{t('common.activityDefault') || 'ha realizado una actividad.'}</span>;
  }

  const Icon = type === 'list_created' ? ListIcon : (type === 'friend_added' ? Users : Sparkles);

  return (
    <div className="activity-card animate-fadeIn">
      <div className="activity-header">
        <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt="" className="user-avatar-sm" />
        <div className="activity-info">
          <div className="activity-user">{user.name}</div>
          <div className="activity-time"><Clock size={12} /> {date}</div>
        </div>
      </div>
      <div className="activity-body">
        <div className="activity-icon-box"><Icon size={16} /></div>
        <div className="activity-text">{content}</div>
      </div>
    </div>
  );
};

const Community = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(null); // ID of user being followed
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();

    // Listen for real-time activities
    socket.on('new_activity', (newAct) => {
      console.log("📣 Real-time activity received:", newAct);
      setActivities(prev => [newAct, ...prev]);
    });

    socket.on('friend_request', (data) => {
      console.log("👥 Friend request received:", data);
      // We could add it manually or just re-fetch to get the full object
      fetchData();
    });

    socket.on('friend_accepted', (data) => {
      console.log("✅ Friend request accepted:", data);
      fetchData();
    });

    return () => {
      socket.off('new_activity');
      socket.off('friend_request');
      socket.off('friend_accepted');
    };
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actRes, pendRes, friendsRes, suggRes] = await Promise.all([
        socialApi.getActivities(),
        user?.id ? socialApi.getPendingRequests(user.id) : Promise.resolve({ data: [] }),
        user?.id ? socialApi.getFriends(user.id) : Promise.resolve({ data: [] }),
        user?.id && typeof user.id === 'number' ? socialApi.getSuggestions(user.id) : Promise.resolve({ data: [] })
      ]);
      setActivities(actRes.data);
      setPendingRequests(pendRes.data);
      setFriends(friendsRes.data);
      setSuggestions(suggRes.data);
    } catch (err) {
      console.error("Error fetching community data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, status) => {
    try {
      await socialApi.updateRequest(requestId, status);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
      if (status === 'accepted') fetchData();
    } catch (err) {
      console.error("Error updating request:", err);
    }
  };

  const handleSendRequest = async (recipientId) => {
    if (sendingRequest) return;
    setSendingRequest(recipientId);
    try {
      await socialApi.sendRequest({
        sender_id: user.id,
        recipient_id: recipientId
      });
      // Refresh suggestions
      const suggRes = await socialApi.getSuggestions(user.id);
      setSuggestions(suggRes.data);
    } catch (err) {
      console.error("Error sending friend request:", err);
    } finally {
      setSendingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="view-container animate-fadeIn">
      <div className="community-layout">
        <div className="community-main">
          <div className="lists-header">
            <h2 className="section-title" style={{ marginBottom: 0 }}>{t('community.title')}</h2>
          </div>
          
          <div className="activity-feed">
            {activities.length > 0 ? (
              activities.map(act => <ActivityCard key={act.id} activity={act} />)
            ) : (
              <div className="empty-state">{t('community.noActivity')}</div>
            )}
          </div>
        </div>

        <div className="community-sidebar">
          {pendingRequests.length > 0 && (
            <div className="sidebar-section">
              <h2 className="section-title">{t('community.requests')}</h2>
              <div className="requests-list">
                {pendingRequests.map(req => (
                  <div key={req.id} className="request-card">
                    <img 
                      src={req.sender.avatar || `https://ui-avatars.com/api/?name=${req.sender.name}`} 
                      className="user-avatar-sm" 
                      alt="" 
                    />
                    <div className="request-info">
                      <div className="request-name">{req.sender.name}</div>
                      <div className="request-actions">
                        <button className="btn-icon accept" onClick={() => handleRequestAction(req.id, 'accepted')}>
                          <Check size={14} />
                        </button>
                        <button className="btn-icon reject" onClick={() => handleRequestAction(req.id, 'rejected')}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h2 className="section-title">{t('common.friends')}</h2>
            <div className="sidebar-friends-list">
              {friends.length > 0 ? (
                friends.map(friend => (
                  <div key={friend.id} className="sidebar-friend-card">
                    <div className="friend-info-group">
                      <img 
                        src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}`} 
                        className="user-avatar-sm" 
                        alt="" 
                      />
                      <span className="friend-name">{friend.name}</span>
                    </div>
                    <button 
                      className="chat-link-btn" 
                      onClick={() => navigate(`/chat/${friend.id}`)}
                      title={t('community.openChat')}
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-muted small">{t('community.noFriends')}</p>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h2 className="section-title">{t('community.suggestions')}</h2>
            <div className="suggestions-list">
              {suggestions.length > 0 ? (
                suggestions.map(person => (
                  <div key={person.id} className="sidebar-friend-card">
                    <div className="friend-info-group">
                      <img 
                        src={person.avatar || `https://ui-avatars.com/api/?name=${person.name}`} 
                        className="user-avatar-sm" 
                        alt="" 
                      />
                      <span className="friend-name">{person.name}</span>
                    </div>
                    <button 
                      className="chat-link-btn" 
                      onClick={() => handleSendRequest(person.id)}
                      title={t('community.sendRequest')}
                      disabled={sendingRequest === person.id}
                      style={{ opacity: sendingRequest === person.id ? 0.5 : 1 }}
                    >
                      {sendingRequest === person.id ? (
                        <div className="fighting-dots-sm" style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <UserPlus size={16} />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-muted small">{t('community.noSuggestions') || 'No hay sugerencias disponibles'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;

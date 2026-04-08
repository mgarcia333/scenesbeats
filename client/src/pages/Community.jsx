import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { socialApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserPlus, Check, X, Clock, MessageSquare, 
  Heart, Sparkles, Film, Music, List as ListIcon 
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actRes, pendRes] = await Promise.all([
        socialApi.getActivities(),
        user ? socialApi.getPendingRequests(user.id) : Promise.resolve({ data: [] })
      ]);
      setActivities(actRes.data);
      setPendingRequests(pendRes.data);
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

  return (
    <div className="view-container animate-fadeIn">
      <div className="community-layout">
        <div className="community-main">
          <h1 className="view-title">{t('community.title')}</h1>
          
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
            <h2 className="section-title">{t('community.suggestions')}</h2>
            <div className="suggestions-box">
              <p className="text-muted small">{t('community.suggestionsDesc')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;

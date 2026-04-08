import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import ActivityCard from '../components/ActivityCard';
import { Users, UserPlus, Zap } from 'lucide-react';

const Community = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Hardcoded real community activity for demo
  const [friendActivity] = useState([
    {
      id: 1,
      user: "Alex",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      action: t('home.listened') || "escuchó",
      item: "Midnights - Taylor Swift",
      meta: t('home.timeAgo', { count: 2, unit: 'h' }) || "hace 2h",
      comment: "Increíble producción, 'Anti-Hero' es un hit instantáneo."
    },
    {
      id: 2,
      user: "Maria",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      action: t('home.reacted') || "reaccionó a",
      item: "Curtain Call - Eminem",
      meta: t('home.timeAgo', { count: 5, unit: 'h' }) || "hace 5h",
      comment: "Nostalgia pura."
    },
    {
      id: 3,
      user: "Dani",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dani",
      action: t('home.watched') || "vio",
      item: "Inception (2010)",
      meta: t('home.timeAgo', { count: 1, unit: 'd' }) || "hace 1d",
      comment: "Todavía intentando entender el final."
    },
    {
      id: 4,
      user: "Carla",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
      action: t('home.listened') || "escuchó",
      item: "Blonde - Frank Ocean",
      meta: "hace 3h",
      comment: "Perfecto para este clima."
    }
  ]);

  return (
    <div className="view-container">
      <div className="community-header">
        <h2 className="section-title">{t('nav.community') || "Comunidad"}</h2>
        <p className="rec-subtitle">Descubre qué están escuchando y viendo tus amigos en tiempo real.</p>
      </div>

      <div className="community-layout animate-fadeIn">
        {/* Left side: Activity Feed */}
        <div className="activity-feed">
          <div className="feed-header">
            <Zap size={18} className="text-primary" />
            <span>Actividad Reciente</span>
          </div>
          
          <div className="feed-items">
            {friendActivity.map(item => (
              <div key={item.id} className="feed-item-wrapper animate-fadeInUp">
                <ActivityCard activity={item} />
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Social Tools (Future) */}
        <div className="social-sidebar">
          <div className="social-card glass">
            <h4>Sugerencias para ti</h4>
            <div className="suggested-users">
               <div className="suggested-user">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marc" alt="" />
                  <div className="user-meta">
                    <span className="name">Marc G.</span>
                    <span className="mutual">3 amigos en común</span>
                  </div>
                  <button className="add-btn"><UserPlus size={16} /></button>
               </div>
               <div className="suggested-user">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" alt="" />
                  <div className="user-meta">
                    <span className="name">Elena R.</span>
                    <span className="mutual">Le gusta tu misma música</span>
                  </div>
                  <button className="add-btn"><UserPlus size={16} /></button>
               </div>
            </div>
            <button className="view-all-btn">Ver todos</button>
          </div>

          <div className="social-card glass stats-card">
            <div className="stat-row">
               <Users size={20} />
               <div className="stat-info">
                  <span className="val">12</span>
                  <span className="lab">Seguidores</span>
               </div>
            </div>
            <div className="stat-row">
               <UserPlus size={20} />
               <div className="stat-info">
                  <span className="val">45</span>
                  <span className="lab">Siguiendo</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;

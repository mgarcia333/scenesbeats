import React from 'react';

const ActivityCard = ({ activity, isDragging }) => {
  return (
    <div 
      className="activity-card" 
      style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
    >
      <div className="activity-card-header">
        <img 
          src={activity.avatar} 
          alt={activity.user} 
          className="activity-card-avatar" 
        />
        <span className="activity-card-user">{activity.user}</span>
      </div>
      <div className="activity-card-body">
        <div className="activity-card-text">
          {activity.action} <span className="activity-card-item">{activity.item}</span>
        </div>
        {activity.comment && (
          <div className="activity-card-comment">"{activity.comment}"</div>
        )}
      </div>
      <div className="activity-card-meta">{activity.meta}</div>
    </div>
  );
};


export default ActivityCard;

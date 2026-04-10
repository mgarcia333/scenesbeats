import React from 'react';

const LoadingDots = ({ className = "" }) => {
  return (
    <div className={`fighting-dots-container ${className}`}>
      <div className="fighting-dot"></div>
      <div className="fighting-dot"></div>
      <div className="fighting-dot"></div>
    </div>
  );
};

export default LoadingDots;

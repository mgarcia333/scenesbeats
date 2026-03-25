import React from 'react';

const LoadingScreen = ({ message }) => {
  return (
    <div className="loading-screen-container">
      <div className="loading-dots">
        <span className="dot dot-green"></span>
        <span className="dot dot-orange"></span>
        <span className="dot dot-blue"></span>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingScreen;

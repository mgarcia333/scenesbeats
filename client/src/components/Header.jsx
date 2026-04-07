import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user } = useAuth();

  const avatarUrl = user?.avatar || user?.image;

  return (
    <header className="app-header">
      <div className="header-spacer"></div>
      <div className="header-logo-container">
        <Link to="/">
          <img src="/titulo.png" alt="Scenes & Beats" className="header-logo-img" />
        </Link>
      </div>
      <div className="header-profile">
        <Link to="/profile">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="profile-bubble" />
          ) : (
            <div className="profile-bubble placeholder-avatar">
              {user?.name ? user.name.charAt(0) : '?'}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
};

export default Header;

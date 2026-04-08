import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Settings, LogOut } from 'lucide-react';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const avatar = user?.avatar || user?.image;

  return (
    <header className="app-header">
      <div className="header-left">
        {isAuthenticated && (
          <Link to="/settings" className="header-settings-btn">
            <Settings size={22} />
          </Link>
        )}
      </div>
      <h1 className="header-title">ScenesBeats</h1>
      <div className="header-right">
        <div className="header-profile">
          <Link to={user ? '/profile' : '/login'}>
            {avatar ? (
              <img src={avatar} alt="Profile" className="profile-bubble" />
            ) : (
              <div className="profile-bubble placeholder-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Error fetching user for header:", err);
      }
    };
    fetchUser();
  }, []);

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
          {user?.image ? (
            <img src={user.image} alt="Profile" className="profile-bubble" />
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

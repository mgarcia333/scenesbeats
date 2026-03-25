import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Users, Sparkles, User, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <nav className="bottom-navbar">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon">
          <Home size={24} />
        </span>
        <span className="nav-label">{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/community" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon">
          <Users size={24} />
        </span>
        <span className="nav-label">{t('nav.community')}</span>
      </NavLink>
      <NavLink to="/recommendations" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon section-today">
          <Sparkles size={24} />
        </span>
        <span className="nav-label">{t('nav.recommendations')}</span>
      </NavLink>
      <NavLink 
        to={user ? "/profile" : "/login"} 
        className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
      >
        <span className="nav-icon">
          <User size={24} />
        </span>
        <span className="nav-label">{t('nav.profile')}</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon">
          <Settings size={24} />
        </span>
        <span className="nav-label">{t('nav.settings')}</span>
      </NavLink>
    </nav>


  );
};

export default Navbar;


import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search, Sparkles, Users, ListMusic } from 'lucide-react';

const Navbar = () => {
  const { t } = useTranslation();

  return (
    <nav className="bottom-navbar">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon"><Home size={24} /></span>
        <span className="nav-label">{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/search" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon"><Search size={24} /></span>
        <span className="nav-label">{t('nav.search') || 'Buscar'}</span>
      </NavLink>
      <NavLink to="/recommendations" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon"><Sparkles size={24} /></span>
        <span className="nav-label">{t('nav.recommendations')}</span>
      </NavLink>
      <NavLink to="/community" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon"><Users size={24} /></span>
        <span className="nav-label">{t('nav.community')}</span>
      </NavLink>
      <NavLink to="/lists" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
        <span className="nav-icon"><ListMusic size={24} /></span>
        <span className="nav-label">{t('nav.lists')}</span>
      </NavLink>
    </nav>
  );
};

export default Navbar;

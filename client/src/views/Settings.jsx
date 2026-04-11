import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../components/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="view-container">
      <h2 className="section-title">{t('settings.title')}</h2>

      {/* Account info */}
      {isAuthenticated && (
        <div className="settings-group">
          <h3 className="stat-label" style={{ marginBottom: '1rem' }}>{t('settings.accountTitle')}</h3>
          <div className="settings-card">
            <div className="settings-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {(user?.avatar || user?.image) ? (
                  <img
                    src={user.avatar || user.image}
                    alt={user.name}
                    style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--primary-color)' }}
                  />
                ) : (
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--surface-alt)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, color: 'var(--text-primary)'
                  }}>
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="song-name">{user?.name}</div>
                  <div className="song-artist">{user?.email}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearance */}
      <div className="settings-group">
        <h3 className="stat-label" style={{ marginBottom: '1rem' }}>{t('settings.appearance')}</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div>
              <div className="song-name">{t('settings.darkMode')}</div>
              <div className="song-artist">{t('settings.darkModeDesc')}</div>
            </div>
            <button
              className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? t('settings.enabled') : t('settings.disabled')}
            </button>
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="settings-group">
        <h3 className="stat-label" style={{ marginBottom: '1rem' }}>{t('settings.language')}</h3>
        <div className="settings-card">
          <div className="settings-row" style={{ alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div className="song-name">{t('settings.language')}</div>
              <div className="song-artist">{t('settings.languageDesc')}</div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '1rem' }}>
              <button 
                className={`lang-flag-btn ${i18n.language === 'es' ? 'active' : ''}`} 
                onClick={() => changeLanguage('es')}
                title="Español"
                style={{ width: '44px', height: '44px' }}
              >
                <img src="/spain.png" alt="ES" className="flag-img" />
              </button>
              <button 
                className={`lang-flag-btn ${i18n.language === 'en' ? 'active' : ''}`} 
                onClick={() => changeLanguage('en')}
                title="English"
                style={{ width: '44px', height: '44px' }}
              >
                <img src="/ing.png" alt="EN" className="flag-img" />
              </button>
              <button 
                className={`lang-flag-btn ${i18n.language === 'ca' ? 'active' : ''}`} 
                onClick={() => changeLanguage('ca')}
                title="Català"
                style={{ width: '44px', height: '44px' }}
              >
                <img src="/cat.png" alt="CA" className="flag-img" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      {isAuthenticated && (
        <div className="settings-group">
          <h3 className="stat-label" style={{ marginBottom: '1rem' }}>{t('settings.account')}</h3>
          <div className="settings-card">
            <button
              className="rec-button"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                color: 'white',
                padding: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
              onClick={handleLogout}
            >
              <LogOut size={18} />
              {t('settings.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

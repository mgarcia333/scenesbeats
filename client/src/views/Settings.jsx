import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../components/ThemeContext';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="view-container">
      <h2 className="section-title">{t('settings.title')}</h2>
      
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

      <div className="settings-group">
        <h3 className="stat-label" style={{ marginBottom: '1rem' }}>{t('settings.language')}</h3>
        <div className="settings-card">
          <div className="settings-row">
            <div>
              <div className="song-name">{t('settings.language')}</div>
              <div className="song-artist">{t('settings.languageDesc')}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`toggle-btn ${i18n.language === 'es' ? 'active' : ''}`}
                onClick={() => changeLanguage('es')}
              >
                ES
              </button>
              <button 
                className={`toggle-btn ${i18n.language === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3 className="stat-label" style={{ marginBottom: '1rem' }}>{t('settings.account')}</h3>
        <div className="settings-card">
          <button className="rec-button" style={{ width: '100%', background: '#ef4444', color: 'white', padding: '0.75rem' }}>
            {t('settings.logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;



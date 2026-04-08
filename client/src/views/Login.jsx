import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Music2, Film, Mail, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, syncGoogleUser, login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Email/Password states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'spotify_auth_failed') {
      setError(t('login.spotifyError'));
    }
  }, [t]);

  // Hook for custom Google Button
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        // Fetch user data from Google with the access token
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });

        const result = await syncGoogleUser({
          google_id: userInfo.data.sub,
          name: userInfo.data.name,
          email: userInfo.data.email,
          avatar: userInfo.data.picture,
        });

        if (result.status === 'success') {
          navigate('/', { replace: true });
        } else {
          setError(t('login.googleLoginError'));
        }
      } catch (err) {
        console.error('Google login error:', err);
        setError(t('login.googleConnectError'));
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError(t('login.googleError')),
  });

  const handleSpotifyLogin = () => {
    window.location.href = '/api/auth/spotify';
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login({ email, password });
      if (result.status === 'success') {
        navigate('/', { replace: true });
      } else {
        setError(result.message || 'Error al iniciar sesión.');
      }
    } catch (err) {
      setError('Credenciales incorrectas. Por favor, revisa tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      {/* Immersive background visuals */}
      <div className="landing-bg">
        <div className="bg-gradient-overlay" />
        <div className="bg-mesh" />
      </div>

      <div className="landing-content animate-fadeIn">
        {/* Left Side: Pitch/Hero */}
        <div className="landing-hero">
          <div className="landing-logo-box">
             <h1 className="landing-title">ScenesBeats</h1>
          </div>
          <p className="landing-tagline">
            {t('landing.tagline')}
          </p>
          <div className="landing-features">
            <div className="feature-pill">{t('landing.feat1')}</div>
            <div className="feature-pill">{t('landing.feat2')}</div>
            <div className="feature-pill">{t('landing.feat3')}</div>
          </div>

          {/* Language Selector in Hero */}
          <div className="landing-lang-hero animate-fadeInUp">
            <button 
              className={`lang-flag-btn ${i18n.language === 'es' ? 'active' : ''}`} 
              onClick={() => i18n.changeLanguage('es')}
              title="Español"
            >
              <img src="/spain.png" alt="ES" className="flag-img" />
            </button>
            <button 
              className={`lang-flag-btn ${i18n.language === 'en' ? 'active' : ''}`} 
              onClick={() => i18n.changeLanguage('en')}
              title="English"
            >
              <img src="/ing.png" alt="EN" className="flag-img" />
            </button>
            <button 
              className={`lang-flag-btn ${i18n.language === 'ca' ? 'active' : ''}`} 
              onClick={() => i18n.changeLanguage('ca')}
              title="Català"
            >
              <img src="/cat.png" alt="CA" className="flag-img" />
            </button>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="landing-auth-card">
          <div className="auth-header">
            <h2>{t('landing.welcome')}</h2>
            <p>{t('landing.subtitle')}</p>
          </div>

          <div className="auth-methods">
            {/* Social Logins */}
            <div className="social-methods">
              <button className="auth-btn btn-spotify" onClick={handleSpotifyLogin}>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                Spotify
              </button>
              <div className="google-auth-container">
                <button className="auth-btn btn-google" onClick={() => handleGoogleLogin()} disabled={loading}>
                  <svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
                  Google
                </button>
              </div>
            </div>

            <div className="auth-divider">
              <span>{t('landing.orEmail')}</span>
            </div>

            {/* Email Form */}
            <form className="auth-form" onSubmit={handleEmailLogin}>
              <div className="form-group">
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input 
                    type="email" 
                    placeholder={t('auth.email')} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input 
                    type="password" 
                    placeholder={t('auth.password')} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary-solid" disabled={loading}>
                {loading ? t('auth.loggingIn') : t('landing.loginBtn')}
              </button>
            </form>
          </div>

          {error && <div className="auth-error-msg">{error}</div>}

          <div className="auth-footer">
            <p>{t('landing.registerPrompt')} <Link to="/register">{t('landing.registerLink')}</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Github } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

import { jwtDecode } from 'jwt-decode';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, syncGoogleUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Google Decoded:", decoded);
      
      await syncGoogleUser({
        google_id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture
      });
      
      navigate('/profile');
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError('Error al sincronizar con Google');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <div className="auth-header">
          <div className="auth-logo">
            <LogIn size={32} color="var(--primary-color)" />
          </div>
          <h1>Bienvenido de nuevo</h1>
          <p className="auth-subtitle">Inicia sesión en Scenes & Beats</p>
        </div>

        {error && <div className="auth-error glass">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="input-group-premium glass">
            <Mail size={18} className="input-icon" />
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group-premium glass">
            <Lock size={18} className="input-icon" />
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn-primary-premium" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-divider">
          <span>O continúa con</span>
        </div>

        <div className="social-auth">
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Error con Google Login')}
                useOneTap
                theme="filled_black"
                shape="pill"
            />
        </div>

        <p className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

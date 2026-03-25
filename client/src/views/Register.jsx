import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await register({ name, email, password });
      if (res.status === 'success') {
        navigate('/login', { state: { message: '¡Cuenta creada! Ya puedes iniciar sesión.' } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass">
        <div className="auth-header">
          <div className="auth-logo">
            <UserPlus size={32} color="var(--primary-color)" />
          </div>
          <h1>Crea tu cuenta</h1>
          <p className="auth-subtitle">Únete a la comunidad de Scenes & Beats</p>
        </div>

        {error && <div className="auth-error glass">{error}</div>}

        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-group-premium glass">
            <User size={18} className="input-icon" />
            <input 
              type="text" 
              placeholder="Nombre completo" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

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
            {loading ? 'Creando cuenta...' : 'Registrarse'} <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

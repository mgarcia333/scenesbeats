import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated or if we just redirected back
    const checkAuthLine = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error')) {
          console.error("Auth Error:", urlParams.get('error'));
        }

        // We check if the backend has our cookies set
        const res = await fetch('/api/auth/me');
        if (res.ok) {
           const data = await res.json();
           if (data.authenticated) {
              setIsAuthenticated(true);
              setUser(data.user);
           }
        }
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthLine();
  }, []);

  const handleLogin = () => {
    // Redirect to the backend spotify auth endpoint
    window.location.href = 'http://127.0.0.1:5173/api/auth/spotify';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="app-container">
      <h1>🎬 Scenes & Beats 🎵</h1>
      {!isAuthenticated ? (
        <div className="login-card">
          <p>Descubre qué película ver según tu vibra musical de hoy.</p>
          <button onClick={handleLogin} className="spotify-btn">
            Login con Spotify
          </button>
        </div>
      ) : (
        <div className="dashboard-card">
          {user?.image && (
            <img 
              src={user.image} 
              alt="Profile" 
              style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '1rem' }} 
            />
          )}
          <h2>¡Hola, {user?.name || "invitado"}! Estás conectado a Spotify 🎧</h2>
          <p>Próximamente: Tus recomendaciones de cine basadas en tu música.</p>
          <button onClick={handleLogout} className="logout-btn">
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}

export default App

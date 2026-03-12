import { useState, useEffect } from 'react'

const Home = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Check if user is authenticated or if we just redirected back
    const checkAuthLine = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error')) {
          console.error("Auth Error:", urlParams.get('error'));
        }

        // We check if the backend has our cookies set
        const res = await fetch('/api/auth/me', { credentials: 'include' });
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
    window.location.href = '/api/auth/spotify';
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setIsAuthenticated(false);
    setUser(null);
    setRecommendation(null);
    window.location.href = '/';
  };

  const getRecommendation = async () => {
    setLoadingRec(true);
    setErrorMsg("");
    setRecommendation(null);
    try {
      const res = await fetch('/api/recommendation/generate', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMsg(data.error || "Error al obtener recomendación.");
      } else {
        setRecommendation(data);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error de red al conectar con el servidor.");
    } finally {
      setLoadingRec(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="view-container">
      <h1>ScenesBeats</h1>
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
          <h2>¡Hola, {user?.name || "invitado"}! Estás conectado a Spotify</h2>
          
          <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <button 
              onClick={getRecommendation} 
              className="spotify-btn"
              disabled={loadingRec}
              style={{ fontSize: '1.2rem', padding: '1rem 2rem', backgroundColor: loadingRec ? '#ccc' : '#1db954', color: '#000' }}
            >
              {loadingRec ? "Analizando tu vibra..." : "Dime qué película ver hoy"}
            </button>
          </div>

          {errorMsg && <p style={{ color: '#ff4d4d' }}>{errorMsg}</p>}

          {recommendation && (
            <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '1.5rem', borderRadius: '8px', textAlign: 'left', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ color: '#1db954', marginTop: 0 }}>Vibra actual de tu música:</h3>
                <p>{recommendation.vibra}</p>
              </div>
              
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {recommendation.poster_url && (
                    <img 
                      src={recommendation.poster_url} 
                      alt={`Póster de ${recommendation.pelicula}`} 
                      style={{ width: '200px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} 
                    />
                )}
                
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <h3 style={{ color: '#1ed760', marginTop: 0 }}>Película Recomendada:</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{recommendation.pelicula}</p>
                  
                  {recommendation.sinopsis && (
                    <p style={{ fontSize: '0.9rem', color: '#ccc', fontStyle: 'italic', marginBottom: '1rem' }}>
                      {recommendation.sinopsis}
                    </p>
                  )}

                  <h3 style={{ color: '#1db954' }}>¿Por qué?</h3>
                  <p>{recommendation.motivo}</p>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '3rem' }}>
             <button onClick={handleLogout} className="logout-btn">
               Cerrar sesión
             </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home

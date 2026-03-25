import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ActivityCard from '../components/ActivityCard'
import HorizontalScroll from '../components/HorizontalScroll'
import { MovieCard, SongCard } from '../components/Cards'
import { Disc, Sparkles, Star } from 'lucide-react'

import LoadingScreen from '../components/LoadingScreen'

const Home = () => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentSongs, setRecentSongs] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [myRecentMovies, setMyRecentMovies] = useState([]);
  const [friendActivity, setFriendActivity] = useState([

    { 
      id: 1, 
      user: "Alex", 
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      action: "escuchó", 
      item: "Midnights", 
      meta: "hace 2 horas",
      comment: "Increíble producción, 'Anti-Hero' es un hit instantáneo."
    },
    { 
      id: 2, 
      user: "Maria", 
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      action: "reaccionó a", 
      item: "Curtain Call", 
      meta: "hace 5 horas",
      comment: "Nostalgia pura."
    },
    { 
      id: 3, 
      user: "Dani", 
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dani",
      action: "vio", 
      item: "Inception", 
      meta: "hace 1 día",
      comment: "Todavía intentando entender el final."
    }
  ]);

  useEffect(() => {
    const initHome = async () => {
      try {
        setLoading(true);
        const lbUser = localStorage.getItem('lb_username');
        
        // Parallel fetch for public data
        const [authRes, movieRes] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }),
          fetch('/api/recommendation/trending')
        ]);

        if (authRes.ok) {
           const authData = await authRes.json();
           if (authData.authenticated) {
              setIsAuthenticated(true);
              setUser(authData.user);

              const spotifyRes = await fetch('/api/spotify/recently-played', { credentials: 'include' });
              if (spotifyRes.ok) {
                 const spotifyData = await spotifyRes.json();
                 const songs = spotifyData.items.map(item => ({
                   id: item.track.id,
                   name: item.track.name,
                   artist: item.track.artists[0].name,
                   artwork: item.track.album.images[0]?.url
                 }));
                 setRecentSongs(songs);
              }
           }
        }

        if (movieRes.ok) {
          const movies = await movieRes.json();
          setRecentMovies(movies);
        }

        if (lbUser) {
          const lbRes = await fetch(`/api/movie/letterboxd/${lbUser}`);
          if (lbRes.ok) {
            const lbData = await lbRes.json();
            setMyRecentMovies(lbData);
          }
        }

      } catch(err) {
        console.error("Home initialization error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    initHome();
  }, []);

  const handleLogin = () => {
    window.location.href = '/api/auth/spotify';
  };


  if (loading) return <LoadingScreen message={t('home.loading')} />


  if (!isAuthenticated) {
    return (
      <div className="view-container welcome-view">
        <div className="hero-section">
          <h2 className="hero-title">{t('home.welcomeTitle')}</h2>
          <p className="hero-subtitle">{t('home.welcomeSubtitle')}</p>
          <button onClick={handleLogin} className="btn-glossy" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem' }}>
            {t('home.loginSpotify')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="view-container">
      {myRecentMovies.length > 0 && (
        <section className="feed-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-title">{t('home.myRecentMovies')}</h2>
          <HorizontalScroll>
            {myRecentMovies.map((movie, idx) => (
              <MovieCard key={`movie-${movie.id || idx}-${idx}`} movie={movie} />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {recentSongs.length > 0 && (
        <section className="feed-section" style={{ marginBottom: '2.5rem' }}>
          <h2 className="section-title">{t('home.recentSongs')}</h2>
          <HorizontalScroll>
            {recentSongs.map((song, idx) => (
              <SongCard key={`song-${song.id || idx}-${idx}`} song={song} />
            ))}
          </HorizontalScroll>
        </section>
      )}


      <section className="feed-section" style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">{t('home.friendActivity')}</h2>
        <HorizontalScroll>
          {friendActivity.map((item, idx) => (
            <ActivityCard key={`activity-${item.id || idx}-${idx}`} activity={item} />
          ))}
        </HorizontalScroll>
      </section>
    </div>
  )

}


export default Home


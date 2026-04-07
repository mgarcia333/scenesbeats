import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ActivityCard from '../components/ActivityCard'
import HorizontalScroll from '../components/HorizontalScroll'
import { MovieCard, SongCard } from '../components/Cards'
import { Disc, Sparkles, Star } from 'lucide-react'

import LoadingScreen from '../components/LoadingScreen'

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { socket } from '../App';

const Home = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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
        // Resolve Letterboxd username: Prefer user state, fallback to localStorage
        const lbUser = user?.letterboxd_username || localStorage.getItem('lb_username');
        
        // Parallel fetch for public data
        const movieRes = await fetch('/api/recommendation/trending');

        if (isAuthenticated && user) {
           // Sync localStorage if it differs (useful for keeping views in sync)
           if (user.letterboxd_username && localStorage.getItem('lb_username') !== user.letterboxd_username) {
             localStorage.setItem('lb_username', user.letterboxd_username);
           }
           
           try {
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
             } else if (spotifyRes.status === 401) {
               console.warn("Spotify session is not active or unauthorized.");
             }
           } catch (err) {
             console.error("Spotify fetch error:", err);
           }
        }

        if (movieRes.ok) {
          const movies = await movieRes.json();
          setRecentMovies(movies);
        }

        if (lbUser) {
          try {
            const lbRes = await fetch(`/api/movie/letterboxd/${lbUser}`);
            if (lbRes.ok) {
              const lbData = await lbRes.json();
              setMyRecentMovies(lbData);
            } else if (lbRes.status === 404) {
              console.warn(`Letterboxd user "${lbUser}" not found or has no recent activity.`);
              // Optional: Clear or suggest clearing invalid username
            }
          } catch (err) {
            console.error("Letterboxd fetch error:", err);
          }
        }

      } catch(err) {
        console.error("Home initialization error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    initHome();
  }, [user, isAuthenticated]);

  useEffect(() => {
    // Listen for real-time Spotify updates
    socket.on('spotify_update', (newTrack) => {
      console.log("Real-time Spotify update received:", newTrack);
      setRecentSongs(prev => {
        // Prevent duplicates if by some chance they occur
        if (prev.length > 0 && prev[0].id === newTrack.id) return prev;
        
        // Add new track at the beginning and keep last 20
        const updated = [newTrack, ...prev];
        return updated.slice(0, 20);
      });
    });

    return () => {
      socket.off('spotify_update');
    };
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };


  if (loading || authLoading) return <LoadingScreen message={t('home.loading')} />


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


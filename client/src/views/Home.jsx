import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import ActivityCard from '../components/ActivityCard';
import HorizontalScroll from '../components/HorizontalScroll';
import { MovieCard, SongCard } from '../components/Cards';
import { useAuth } from '../context/AuthContext';
import { recommendationApi, spotifyApi, movieApi } from '../api';
import LoadingDots from '../components/LoadingDots';

const Home = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, spotifyConnected, loading, syncGoogleUser } = useAuth();
  const [recentSongs, setRecentSongs] = useState([]);
  const [recentMovies, setRecentMovies] = useState([]);
  const [myRecentMovies, setMyRecentMovies] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Manual activity for demo (should ideally come from backend/translation)
  const [friendActivity] = useState([
    {
      id: 1,
      user: "Alex",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      action: t('home.listened'),
      item: "Midnights",
      meta: t('home.timeAgo', { count: 2, unit: 'h' }),
      comment: "Increíble producción, 'Anti-Hero' es un hit instantáneo."
    },
    {
      id: 2,
      user: "Maria",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      action: t('home.reacted'),
      item: "Curtain Call",
      meta: t('home.timeAgo', { count: 5, unit: 'h' }),
      comment: "Nostalgia pura."
    },
    {
      id: 3,
      user: "Dani",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dani",
      action: t('home.watched'),
      item: "Inception",
      meta: t('home.timeAgo', { count: 1, unit: 'd' }),
      comment: "Todavía intentando entender el final."
    }
  ]);

  // Load personalized data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      setDataLoading(true);
      try {
        const fetches = [];

        // Personalized Recommendation History
        fetches.push(
          recommendationApi.getHistory(user.id)
            .then(res => setRecentMovies(res.data))
            .catch(() => {})
        );

        // Spotify recently played (only if spotify is connected)
        if (spotifyConnected) {
          fetches.push(
            spotifyApi.getRecentlyPlayed(20)
              .then(res => {
                const data = res.data;
                if (data?.items) {
                  const songs = data.items.map(item => ({
                    id: item.track.id,
                    name: item.track.name,
                    artist: item.track.artists[0].name,
                    artwork: item.track.album.images[0]?.url,
                    previewUrl: item.track.preview_url,
                    spotifyUrl: item.track.external_urls.spotify,
                  }));
                  setRecentSongs(songs);
                }
              })
              .catch(() => {})
          );
        }

        // Letterboxd movies (only if username is configured)
        if (user?.letterboxd_username) {
          fetches.push(
            movieApi.getLetterboxd(user.letterboxd_username)
              .then(res => setMyRecentMovies(res.data))
              .catch(() => {})
          );
        }

        await Promise.all(fetches);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, spotifyConnected, user?.letterboxd_username]);

  const handleSpotifyLogin = () => {
    window.location.href = '/api/auth/spotify';
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const result = await syncGoogleUser({
        google_id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
      });
      if (result.status !== 'success') {
        console.error('Google sync failed');
      }
    } catch (err) {
      console.error('Google login error:', err);
    }
  };

  // Show loading screen only on initial auth check
  if (loading) {
    return (
      <div className="loading-screen">
        <LoadingDots />
      </div>
    );
  }

  // Welcome screen for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="view-container welcome-view">
        <div className="hero-section">
          <h2 className="hero-title">{t('home.welcomeTitle')}</h2>
          <p className="hero-subtitle">{t('home.welcomeSubtitle')}</p>

          <div className="welcome-auth-buttons">
            <button onClick={handleSpotifyLogin} className="spotify-login-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '0.5rem' }}>
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              {t('home.loginSpotify')}
            </button>

            <div className="welcome-divider">
              <span />
              <p>{t('home.or')}</p>
              <span />
            </div>

            <div className="welcome-google-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error('Google login failed')}
                width="280"
                theme="filled_black"
                shape="pill"
                text="continue_with"
                locale={i18n.language}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated home feed
  return (
    <div className="view-container">
      {/* Letterboxd movies */}
      {myRecentMovies.length > 0 && (
        <section className="feed-section">
          <h2 className="section-title">{t('home.myRecentMovies')}</h2>
          <HorizontalScroll>
            {myRecentMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {/* Spotify songs */}
      {recentSongs.length > 0 && (
        <section className="feed-section" style={{ marginTop: myRecentMovies.length > 0 ? '2.5rem' : '0' }}>
          <h2 className="section-title">{t('home.recentSongs')}</h2>
          <HorizontalScroll>
            {recentSongs.map((song, idx) => (
              <SongCard key={`${song.id}-${idx}`} song={song} />
            ))}
          </HorizontalScroll>
        </section>
      )}

      {/* CTA cards if no Spotify/Letterboxd connected */}
      {!spotifyConnected && !user?.letterboxd_username && (
        <section className="feed-section">
          <div className="connect-cta-card">
            <p className="connect-cta-text">
              {t('home.connectCTA')}
            </p>
            <button
              className="rec-button"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
              onClick={() => navigate('/profile')}
            >
              {t('home.goToProfile')}
            </button>
          </div>
        </section>
      )}

      {/* Latest Recommendations (History) */}
      {recentMovies.length > 0 && (
        <section className="feed-section" style={{ marginTop: '2.5rem' }}>
          <h2 className="section-title">{t('home.latestRecommendations')}</h2>
          <HorizontalScroll>
            {recentMovies.map((item, idx) => (
              item.type === 'song' ? (
                <SongCard key={`${item.id || idx}-${idx}`} song={{
                  id: item.external_id,
                  name: item.title,
                  artist: item.subtitle,
                  artwork: item.image_url
                }} />
              ) : (
                <MovieCard key={`${item.id || idx}-${idx}`} movie={{
                  id: item.external_id,
                  title: item.title,
                  year: item.subtitle,
                  poster: item.image_url
                }} />
              )
            ))}
          </HorizontalScroll>
        </section>
      )}

    </div>
  );
};

export default Home;

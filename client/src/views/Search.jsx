import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MovieCard, SongCard } from '../components/Cards';
import { movieApi, spotifyApi, socialApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { socket } from '../App';
import { 
  Search as SearchIcon, Clapperboard, Music, 
  Users, UserPlus, Star, Info, User, Check
} from 'lucide-react';
import LoadingDots from '../components/LoadingDots';

const PersonCard = ({ person }) => (
  <div className="person-card animate-fadeIn">
    <div className="person-img-box">
      {person.image ? (
        <img src={person.image} alt={person.name} className="person-img" />
      ) : (
        <div className="person-placeholder"><Star size={24} /></div>
      )}
    </div>
    <div className="person-info">
      <div className="person-name">{person.name}</div>
      <div className="person-role">{person.role}</div>
      {person.known_for && <div className="person-known small">{t('search.knownFor')}: {person.known_for}</div>}
    </div>
  </div>
);

const UserSearchResultCard = ({ result, onAdd }) => {
  const [sent, setSent] = useState(false);
  
  const handleAdd = async () => {
    setSent(true);
    await onAdd(result.id);
  };

  return (
    <div className="user-search-card animate-fadeIn">
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
        onClick={() => window.location.href = `/user/${result.id}`}
      >
        <img src={result.avatar || `https://ui-avatars.com/api/?name=${result.name}`} alt="" className="user-avatar" />
        <div>
          <div className="user-name">{result.name}</div>
          <div className="user-email small">{result.email}</div>
        </div>
      </div>
      <button className={`btn-social ${sent ? 'sent' : ''}`} onClick={handleAdd} disabled={sent}>
        {sent ? <Check size={16} /> : <UserPlus size={16} />}
        <span>{sent ? t('common.sent') || 'Enviado' : t('common.add') || 'Añadir'}</span>
      </button>
    </div>
  );
};

const ArtistCard = ({ artist }) => (
  <div className="person-card animate-fadeIn">
    <div className="person-img-box artist">
      {artist.image ? (
        <img src={artist.image} alt={artist.name} className="artist-img" />
      ) : (
        <div className="person-placeholder"><Music size={24} /></div>
      )}
    </div>
    <div className="person-info">
      <div className="person-name">{artist.name}</div>
      <div className="person-role">{artist.genres || t('search.musician')}</div>
    </div>
  </div>
);

const Search = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('movies'); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (term = searchTerm) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      let res;
      switch (searchType) {
        case 'movies':
          res = await movieApi.search(term);
          setResults(res.data);
          break;
        case 'music':
          const spotifyRes = await nodeApi.get(`/spotify/search?query=${term}&type=track`);
          const tracks = spotifyRes.data.tracks.items.map(t => ({
            id: t.id,
            name: t.name,
            artist: t.artists[0].name,
            artwork: t.album.images[0]?.url
          }));
          setResults(tracks);
          break;
        case 'people':
          res = await movieApi.searchPeople(term);
          setResults(res.data);
          break;
        case 'artists':
          res = await spotifyApi.searchArtists(term);
          setResults(res.data);
          break;
        case 'users':
          res = await socialApi.searchUsers(term);
          // Filter out self
          setResults(res.data.filter(u => String(u.id) !== String(user.id)));
          break;
        default:
          break;
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (friendId) => {
    try {
      await socialApi.sendRequest({
        sender_id: user.id,
        recipient_id: friendId
      });
      // Emit socket event for real-time notification
      socket.emit('friend_request', {
        from: user.name,
        toId: friendId
      });
    } catch (err) {
      console.error("Error sending friend request:", err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchType]);

  return (
    <div className="view-container">
      <div className="search-header">
        <div className="search-bar-container">
          <span className="search-icon"><SearchIcon size={20} /></span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="search-tabs-scroll">
          <div className="search-tabs">
            <button className={`search-tab ${searchType === 'movies' ? 'active' : ''}`} onClick={() => setSearchType('movies')}>
              <Clapperboard size={16} /> {t('search.movies')}
            </button>
            <button className={`search-tab ${searchType === 'music' ? 'active' : ''}`} onClick={() => setSearchType('music')}>
              <Music size={16} /> {t('search.music')}
            </button>
            <button className={`search-tab ${searchType === 'people' ? 'active' : ''}`} onClick={() => setSearchType('people')}>
              <Star size={16} /> {t('search.people')}
            </button>
            <button className={`search-tab ${searchType === 'artists' ? 'active' : ''}`} onClick={() => setSearchType('artists')}>
              <Users size={16} /> {t('search.artists')}
            </button>
            <button className={`search-tab ${searchType === 'users' ? 'active' : ''}`} onClick={() => setSearchType('users')}>
              <User size={16} /> {t('search.users')}
            </button>
          </div>
        </div>
      </div>

      <div className="search-results">
        {loading ? (
          <div className="search-loading">
            <LoadingDots />
            <span>Buscando en la galaxia...</span>
          </div>
        ) : results.length > 0 ? (
          <div className={searchType === 'movies' || searchType === 'music' ? 'results-grid' : 'social-results-list'}>
            {results.map((item, idx) => {
              if (searchType === 'movies') return <MovieCard key={item.id + idx} movie={item} />;
              if (searchType === 'music') return <SongCard key={item.id + idx} song={item} />;
              if (searchType === 'people') return <PersonCard key={item.id + idx} person={item} />;
              if (searchType === 'artists') return <ArtistCard key={item.id + idx} artist={item} />;
              if (searchType === 'users') return <UserSearchResultCard key={item.id + idx} result={item} onAdd={handleAddFriend} />;
              return null;
            })}
          </div>
        ) : searchTerm ? (
          <div className="empty-state">{t('search.noResults', { query: searchTerm })}</div>
        ) : (
          <div className="search-placeholder-full">
            <SearchIcon size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} />
            <h2>{t('search.exploreTitle')}</h2>
            <p className="text-muted">{t('search.exploreSubtitle')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

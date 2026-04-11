import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MovieCard, SongCard } from '../components/Cards';
import { movieApi, spotifyApi, socialApi, nodeApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { socket } from '../App';
import { 
  Search as SearchIcon, Clapperboard, Music, 
  Users, UserPlus, Star, User, Check, X, Clock
} from 'lucide-react';

const STORAGE_KEY = 'sb_recent_searches';
const MAX_RECENT = 8;

const getRecentSearches = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveRecentSearch = (term, type) => {
  const recent = getRecentSearches();
  const newEntry = { term, type, timestamp: Date.now() };
  const filtered = recent.filter(r => r.term !== term);
  const updated = [newEntry, ...filtered].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

const clearRecentSearches = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const PersonCard = ({ person, t }) => (
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

const UserSearchResultCard = ({ result, onAdd, t }) => {
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

const ArtistCard = ({ artist, t }) => (
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

const RecentSearchItem = ({ item, onClick, onDelete }) => {
  const icon = item.type === 'movies' ? <Clapperboard size={14} /> :
               item.type === 'music' ? <Music size={14} /> :
               item.type === 'people' ? <Star size={14} /> :
                                       <User size={14} />;
  
  return (
    <div className="recent-search-item" onClick={() => onClick(item.term, item.type)}>
      <span className="recent-search-icon">{icon}</span>
      <span className="recent-search-term">{item.term}</span>
      <button className="recent-search-delete" onClick={(e) => { e.stopPropagation(); onDelete(item.term); }}>
        <X size={12} />
      </button>
    </div>
  );
};

const Search = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('movies'); 
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);

  const handleSearch = async (term = searchTerm, type = searchType) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      let res;
      switch (type) {
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
          setResults(res.data.filter(u => String(u.id) !== String(user.id)));
          break;
        default:
          break;
      }
      saveRecentSearch(term, type);
      setRecentSearches(getRecentSearches());
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
      socket.emit('friend_request', {
        from: user.name,
        toId: friendId
      });
    } catch (err) {
      console.error("Error sending friend request:", err);
    }
  };

  const handleRecentClick = (term, type) => {
    setSearchTerm(term);
    setSearchType(type);
  };

  const handleRecentDelete = (term) => {
    const updated = recentSearches.filter(r => r.term !== term);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchTerm, searchType);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchType]);

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      handleSearch(searchTerm.trim(), searchType);
    }
  };

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
            onKeyDown={handleInputKeyDown}
          />
        </div>

        <div className="search-type-slider">
          <div className="search-type-track">
            {['movies', 'music', 'people', 'artists', 'users'].map(type => (
              <button
                key={type}
                className={`search-type-btn ${searchType === type ? 'active' : ''}`}
                onClick={() => setSearchType(type)}
              >
                {type === 'movies' && <Clapperboard size={16} />}
                {type === 'music' && <Music size={16} />}
                {type === 'people' && <Star size={16} />}
                {type === 'artists' && <Users size={16} />}
                {type === 'users' && <User size={16} />}
              </button>
            ))}
          </div>
        </div>

        {!searchTerm && recentSearches.length > 0 && (
          <div className="recent-searches-section">
            <div className="recent-searches-header">
              <Clock size={14} />
              <span>Recientes</span>
              <button className="recent-clear-all" onClick={clearRecentSearches}>
                <X size={12} />
              </button>
            </div>
            <div className="recent-searches-list">
              {recentSearches.map((item, idx) => (
                <RecentSearchItem
                  key={idx}
                  item={item}
                  onClick={handleRecentClick}
                  onDelete={handleRecentDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>

        <div className="search-results">
        {loading ? (
          <div className="search-loading">
            <div className="loading-spinner"></div>
            <span>Cargando resultados...</span>
          </div>
        ) : results.length > 0 ? (
          <div className={searchType === 'movies' || searchType === 'music' ? 'results-grid' : 'results-list'}>
            {results.map((item, idx) => {
              if (searchType === 'movies') return <MovieCard key={item.id + idx} movie={item} />;
              if (searchType === 'music') return <SongCard key={item.id + idx} song={item} />;
              if (searchType === 'people') return <PersonCard key={item.id + idx} person={item} t={t} />;
              if (searchType === 'artists') return <ArtistCard key={item.id + idx} artist={item} t={t} />;
              if (searchType === 'users') return <UserSearchResultCard key={item.id + idx} result={item} onAdd={handleAddFriend} t={t} />;
              return null;
            })}
          </div>
        ) : searchTerm ? (
          <div className="empty-state">
            <SearchIcon size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p>No se encontraron resultados para "{searchTerm}"</p>
          </div>
        ) : (
          <div className="search-placeholder-full">
            <div className="search-placeholder-icon">
              <SearchIcon size={40} />
            </div>
            <h3>Explora películas, música y más</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Busca por título, artista, actor o usuario</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

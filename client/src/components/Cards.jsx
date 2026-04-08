import React from 'react';
import { Link } from 'react-router-dom';

export const MovieCard = ({ movie, isDragging }) => (
  <div className="movie-card" style={{ userSelect: 'none' }}>
    <Link 
      to={`/movie/${movie.id}`}
      style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
    >
      <img 
        src={movie.poster || movie.artwork || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop"} 
        className="movie-artwork" 
        alt={movie.title || movie.name} 
        draggable="false"
      />
    </Link>
    <div className="movie-name" title={movie.title || movie.name}>{movie.title || movie.name}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="movie-year">{movie.year}</div>
    </div>
  </div>
);

export const SongCard = ({ song, isDragging }) => (
  <div 
    className="song-card" 
    style={{ 
      userSelect: 'none',
      pointerEvents: isDragging ? 'none' : 'auto' 
    }}
  >
    <Link to={`/song/${song.id}`}>
      <img 
        src={song.artwork} 
        alt={song.name} 
        className="song-artwork" 
        draggable="false"
      />
    </Link>
    <div className="song-name">{song.name}</div>
    <div className="song-artist">{song.artist}</div>
  </div>
);


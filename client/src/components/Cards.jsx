import React from 'react';
import { Link } from 'react-router-dom';

const renderStars = (rating) => {
  if (!rating) return null;
  const numericRating = parseFloat(rating);
  const fullStars = Math.floor(numericRating);
  const hasHalf = numericRating % 1 !== 0;
  
  return (
    <div className="stars-container">
      {"★".repeat(fullStars)}{hasHalf ? "½" : ""}
    </div>
  );
};

export const MovieCard = ({ movie, isDragging }) => (
  <Link 
    to={`/movie/${movie.id}`}
    className="movie-card" 
    style={{ 
      userSelect: 'none', 
      textDecoration: 'none', 
      color: 'inherit',
      display: 'block',
      pointerEvents: isDragging ? 'none' : 'auto' 
    }}
  >
    <img 
      src={movie.poster || movie.artwork || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop"} 
      className="movie-artwork" 
      alt={movie.title || movie.name} 
      draggable="false"
    />
    <div className="movie-name" title={movie.title || movie.name}>{movie.title || movie.name}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="movie-year">{movie.year}</div>
      {movie.rating && renderStars(movie.rating)}
    </div>
  </Link>
);

export const SongCard = ({ song, isDragging }) => (
  <Link 
    to={`/song/${song.id}`}
    className="song-card" 
    style={{ 
      userSelect: 'none',
      textDecoration: 'none',
      color: 'inherit',
      display: 'block',
      pointerEvents: isDragging ? 'none' : 'auto' 
    }}
  >
    <img 
      src={song.artwork || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop"} 
      alt={song.name} 
      className="song-artwork" 
      draggable="false"
    />
    <div className="song-name">{song.name}</div>
    <div className="song-artist">{song.artist}</div>
  </Link>
);


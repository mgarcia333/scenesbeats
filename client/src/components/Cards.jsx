import React from 'react';
import { Star } from 'lucide-react';

export const renderStars = (rating) => {
  if (!rating) return <div className="stars-container" style={{ opacity: 0 }}><Star size={12} /></div>;
  const num = parseFloat(rating);
  const fullStars = Math.floor(num);
  const halfStar = num % 1 !== 0;
  return (
    <div className="stars-container">
      {[...Array(fullStars)].map((_, i) => <Star key={i} size={12} fill="currentColor" style={{ display: 'inline' }} />)}
      {halfStar ? "½" : ""}
    </div>
  );
};

export const MovieCard = ({ movie, isDragging }) => (
  <div className="movie-card" style={{ userSelect: 'none' }}>
    <a 
      href={movie.link || "#"} 
      target="_blank" 
      rel="noopener noreferrer" 
      style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
    >
      <img 
        src={movie.poster || movie.artwork || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop"} 
        className="movie-artwork" 
        alt={movie.title || movie.name} 
        draggable="false"
      />
    </a>
    <div className="movie-name" title={movie.title || movie.name}>{movie.title || movie.name}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="movie-year">{movie.year}</div>
      {renderStars(movie.rating)}
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
    <img 
      src={song.artwork} 
      alt={song.name} 
      className="song-artwork" 
      draggable="false"
    />
    <div className="song-name">{song.name}</div>
    <div className="song-artist">{song.artist}</div>
    {renderStars(0)}
  </div>
);


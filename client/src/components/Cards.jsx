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

export const MovieCard = ({ movie, isDragging, showRating = true }) => (
  <div className="movie-card" style={{ userSelect: 'none', position: 'relative' }}>
    <a 
      href={movie.link || "#"} 
      target="_blank" 
      rel="noopener noreferrer" 
      style={{ 
        pointerEvents: isDragging ? 'none' : 'auto', 
        display: 'block', 
        margin: '0 auto',
        position: 'relative',
        borderRadius: '3px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      <img 
        src={movie.poster || movie.artwork || "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop"} 
        className="movie-artwork" 
        alt={movie.title || movie.name} 
        draggable="false"
        style={{ border: 'none', display: 'block' }}
      />
    </a>
    <div className="movie-name" title={movie.title || movie.name} style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>{movie.title || movie.name}</div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <div className="movie-year" style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{movie.year}</div>
      {showRating && movie.rating && renderStars(movie.rating)}
    </div>
  </div>
);

export const SongCard = ({ song, isDragging, showRating = true }) => (
  <div 
    className="song-card" 
    style={{ 
      userSelect: 'none',
      pointerEvents: isDragging ? 'none' : 'auto' 
    }}
  >
    <div style={{ 
      position: 'relative', 
      width: '110px', 
      height: '110px', 
      margin: '0 auto',
      borderRadius: '4px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <img 
        src={song.artwork} 
        alt={song.name} 
        className="song-artwork" 
        draggable="false"
        style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
      />
    </div>
    <div className="song-name" style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-primary)' }}>{song.name}</div>
    <div className="song-artist" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{song.artist}</div>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2px' }}>
      {showRating && song.rating && renderStars(song.rating)}
    </div>
  </div>
);




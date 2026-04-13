import React, { useState, useRef } from 'react';

const HorizontalScroll = ({ children }) => {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    // Use a temp ref or state to track if we *might* start dragging
    scrollRef.current.dataset.maybeDragging = 'true';
    document.body.classList.add('grabbing');
  };

  const stopDragging = () => {
    setIsDragging(false);
    scrollRef.current.dataset.maybeDragging = 'false';
    document.body.classList.remove('grabbing');
  };

  const handleMouseMove = (e) => {
    if (scrollRef.current.dataset.maybeDragging !== 'true') return;
    
    const x = e.pageX - scrollRef.current.offsetLeft;
    const distance = Math.abs(x - startX);
    
    // Threshold of 5 pixels to distinguish from a click
    if (distance > 5 && !isDragging) {
      setIsDragging(true);
    }

    if (!isDragging) return;

    e.preventDefault();
    const walk = (x - startX) * 2; // Scroll speed
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; 
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div 
      className={`horizontal-scroll ${isDragging ? 'dragging' : ''}`}
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={stopDragging}
      onMouseUp={stopDragging}
      onMouseMove={handleMouseMove}
    >
      {children}
    </div>
  );
};

export default HorizontalScroll;

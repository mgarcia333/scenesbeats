import React, { useState, useRef } from 'react';

const HorizontalScroll = ({ children }) => {
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div 
      className={`horizontal-scroll ${isDragging ? 'dragging' : ''}`}
      ref={scrollRef}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {React.Children.map(children, child => {
        // We pass the isDragging prop to children components that need it
        // but avoid passing it to standard DOM elements (strings) to prevent warnings
        if (React.isValidElement(child) && typeof child.type !== 'string') {
          return React.cloneElement(child, { isDragging });
        }
        return child;
      })}
    </div>
  );
};

export default HorizontalScroll;

import React, { useRef, useEffect } from 'react';
import { useSpatialFocus } from '../../components/SpatialFocusContainer';

interface TVRowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  // Allows the row container to auto-scroll based on focused child
  autoScroll?: boolean;
}

export const TVRow: React.FC<TVRowProps> = ({
  title,
  children,
  className = '',
  autoScroll = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { focusedId } = useSpatialFocus();

  // Handle native smooth scrolling for the row when a child gets focused
  useEffect(() => {
    if (autoScroll && containerRef.current && focusedId) {
      const container = containerRef.current;
      const focusedElement = document.getElementById(focusedId);
      
      if (focusedElement && container.contains(focusedElement)) {
        // TV scrolling relies heavily on scrollIntoView, but we can manage scrollLeft manually for smoother rails
        const containerRect = container.getBoundingClientRect();
        const elementRect = focusedElement.getBoundingClientRect();
        
        const offsetLeft = focusedElement.offsetLeft;
        const scrollTarget = offsetLeft - (containerRect.width / 2) + (elementRect.width / 2);
        
        container.scrollTo({
          left: Math.max(0, scrollTarget),
          behavior: 'smooth'
        });
      }
    }
  }, [focusedId, autoScroll]);

  return (
    <div className={`flex flex-col gap-4 mb-tv-row-gap ${className}`}>
      {title && (
        <h2 className="text-tv-title font-bold text-tv-text-primary px-tv-safe-h">
          {title}
        </h2>
      )}
      <div 
        ref={containerRef}
        className="flex gap-tv-card-gap px-tv-safe-h overflow-x-hidden pb-8 pt-4 tv-scrollbar"
      >
        {children}
      </div>
    </div>
  );
};

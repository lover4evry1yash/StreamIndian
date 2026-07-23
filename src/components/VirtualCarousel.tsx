import React, { useRef, useState, useEffect, useCallback } from 'react';

interface VirtualCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  itemWidth: number;
  itemHeight?: number;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualCarousel<T>({
  items,
  renderItem,
  itemWidth,
  itemHeight = 280,
  gap = 16,
  overscan = 2,
  className = ''
}: VirtualCarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth);
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollLeft(containerRef.current.scrollLeft);
    }
  }, []);

  const handleFocus = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const indexStr = target.getAttribute('data-carousel-index');
    if (indexStr !== null) {
      setFocusedIndex(parseInt(indexStr, 10));
    } else {
      // Try finding a parent with data-carousel-index
      const parent = target.closest('[data-carousel-index]');
      if (parent) {
        setFocusedIndex(parseInt(parent.getAttribute('data-carousel-index') || '0', 10));
      }
    }
  }, []);

  const totalItemWidth = itemWidth + gap;
  const visibleCount = containerWidth > 0 ? Math.ceil(containerWidth / totalItemWidth) : 5;
  
  // Calculate bounds based on scroll position OR focused index
  let baseIndex = Math.max(0, Math.floor(scrollLeft / totalItemWidth));
  if (focusedIndex !== null) {
    // Ensure focused item is always within the reliable rendered window
    if (focusedIndex < baseIndex) baseIndex = focusedIndex;
    if (focusedIndex > baseIndex + visibleCount - 1) baseIndex = focusedIndex - visibleCount + 1;
  }
  
  const startIndex = Math.max(0, baseIndex - overscan);
  const endIndex = Math.min(items.length - 1, baseIndex + visibleCount + overscan * 2);

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    if (i >= 0 && i < items.length) {
      visibleItems.push({ item: items[i], index: i });
    }
  }

  const totalWidth = items.length * totalItemWidth - gap;

  return (
    <div 
      className={`overflow-x-auto hide-scrollbar scroll-smooth relative ${className}`}
      ref={containerRef}
      onScroll={handleScroll}
      onFocusCapture={handleFocus}
    >
      <div 
        className="relative" 
        style={{ width: `${totalWidth}px`, height: `${itemHeight}px` }}
      >
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            className="absolute top-0"
            style={{ 
              left: `${index * totalItemWidth}px`, 
              width: `${itemWidth}px`,
              height: `${itemHeight}px`
            }}
            data-carousel-index={index}
          >
            {renderItem(item, index, true)}
          </div>
        ))}
      </div>
    </div>
  );
}

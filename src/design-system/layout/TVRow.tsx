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
  const scrollState = useRef({
    isScrolling: false,
    pendingTarget: null as number | null,
    scrollTimeout: null as any
  });

  useEffect(() => {
    const handleScrollEnd = () => {
       if (scrollState.current.scrollTimeout) {
         clearTimeout(scrollState.current.scrollTimeout);
       }
       scrollState.current.scrollTimeout = setTimeout(() => {
          scrollState.current.isScrolling = false;
          if (scrollState.current.pendingTarget !== null && containerRef.current) {
             const target = scrollState.current.pendingTarget;
             scrollState.current.pendingTarget = null;
             scrollState.current.isScrolling = true;
             containerRef.current.scrollTo({
                left: target,
                behavior: 'smooth'
             });
          }
       }, 150); // wait 150ms of no scroll events to consider scroll finished
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScrollEnd);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScrollEnd);
      }
    };
  }, []);

  // Handle native smooth scrolling for the row when a child gets focused
  useEffect(() => {
    if (autoScroll && containerRef.current && focusedId) {
      const container = containerRef.current;
      const focusedElement = document.getElementById(focusedId);

      if (focusedElement && container.contains(focusedElement)) {
        if (import.meta.env.DEV) console.log(`[NAV_LOG] [TVRow] autoScroll triggered for focusedId=${focusedId}`);
        const containerRect = container.getBoundingClientRect();
        const elementRect = focusedElement.getBoundingClientRect();

        const elementCenter = elementRect.left + (elementRect.width / 2);
        const containerCenter = containerRect.left + (containerRect.width / 2);
        const scrollTarget = container.scrollLeft + (elementCenter - containerCenter);
        const scrollLeftBefore = container.scrollLeft;

        if (import.meta.env.DEV) console.log(`[NAV_LOG] [TVRow] Container Element: ${container.tagName}.${container.className}`);
        if (import.meta.env.DEV) console.log(`[NAV_LOG] [TVRow] Focused Element: ${focusedElement.tagName}#${focusedElement.id}`);
        if (import.meta.env.DEV) console.log(`[NAV_LOG] [TVRow] Container Rect: width=${containerRect.width.toFixed(1)}, height=${containerRect.height.toFixed(1)}`);
        if (import.meta.env.DEV) console.log(`[NAV_LOG] [TVRow] Element Rect: left=${elementRect.left.toFixed(1)}, top=${elementRect.top.toFixed(1)}, width=${elementRect.width.toFixed(1)}, height=${elementRect.height.toFixed(1)}`);
        if (import.meta.env.DEV) console.log(`[NAV_LOG] [TVRow] Calculated scrollTarget: ${scrollTarget.toFixed(1)} (Clamped: ${Math.max(0, scrollTarget).toFixed(1)})`);
        if (import.meta.env.DEV) console.log(`[NAV_LOG] [TVRow] row scrollLeft BEFORE autoScroll: ${scrollLeftBefore}`);

        
        const finalTarget = Math.max(0, scrollTarget);
        if (Math.abs(container.scrollLeft - finalTarget) < 2) {
           // Already there, don't set isScrolling
           return;
        }
        
        if (scrollState.current.isScrolling) {
           scrollState.current.pendingTarget = finalTarget;
        } else {
           scrollState.current.isScrolling = true;
           
           // Failsafe timeout in case scroll event doesn't fire or finish
           if (scrollState.current.scrollTimeout) clearTimeout(scrollState.current.scrollTimeout);
           scrollState.current.scrollTimeout = setTimeout(() => {
              scrollState.current.isScrolling = false;
           }, 500);

           container.scrollTo({
             left: finalTarget,
             behavior: 'smooth'
           });
        }

        if (import.meta.env.DEV) console.log(`[NAV_LOG] [TVRow] row scrollLeft AFTER autoScroll (Sync): ${container.scrollLeft}`);
        setTimeout(() => {
          if (import.meta.env.DEV) console.log(`[NAV_LOG] [TVRow] row scrollLeft AFTER autoScroll (Async 300ms): ${container.scrollLeft}`);
        }, 300);
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

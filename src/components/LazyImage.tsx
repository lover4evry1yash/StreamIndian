import React, { useState, useEffect, useRef } from 'react';
import { useImageManager, useRenderMetrics } from '../context/ServiceContext';
import { ImageManager } from '../core/rendering/ImageManager';
import { RenderMetrics } from '../core/rendering/RenderMetrics';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  crossfade?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  fallbackSrc, 
  placeholder,
  className = '',
  alt = '',
  priority = 'low' as 'high' | 'medium' | 'low',
  crossfade = false,
  ...props 
}) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | HTMLImageElement | null>(null);
  const [prevLoadedSrc, setPrevLoadedSrc] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const startTime = useRef<number>(Date.now());
  const imageManager = useImageManager();
  const metrics = useRenderMetrics();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px' } // Load images when they are within 600px of viewport
    );
    if (containerRef.current) {
      observer.observe(containerRef.current as Element);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }
    if (!isVisible) return;

    let isMounted = true;
    setError(false);
    setLoadedSrc(null);
    startTime.current = Date.now();


    if (imageManager) {
      const loadPromise = imageManager.preloadImage(src, priority);
      if (typeof imageManager.registerDisplay === 'function') {
        imageManager.registerDisplay(src);
      }
      loadPromise.then(resolvedSrc => {
        if (!isMounted) return;
        
        if (resolvedSrc) {
          setLoadedSrc(resolvedSrc);
          if (metrics) {
            metrics.recordImageCacheHit(); 
            metrics.recordImageLoadTime(Date.now() - startTime.current);
          }
        } else {
          setError(true);
          if (metrics) metrics.recordImageCacheMiss();
        }
      });
    } else {
      const img = new Image();
      img.onload = () => {
        if (isMounted) setLoadedSrc(src);
      };
      img.onerror = () => {
        if (isMounted) setError(true);
      };
      img.src = src;
    }

    return () => {
      isMounted = false;
      if (imageManager && typeof imageManager.unregisterDisplay === 'function') {
        imageManager.unregisterDisplay(src);
      }
    };
  }, [src, imageManager, crossfade, isVisible]);

  // Handle priority promotion without unmounting
  useEffect(() => {
    let isMounted = true;
    if (imageManager && src && priority === 'high') {
      imageManager.preloadImage(src, priority).then(resolvedSrc => {
        if (isMounted && resolvedSrc) {
           setLoadedSrc(resolvedSrc);
        }
      });
    }
    return () => { isMounted = false; };
  }, [priority, src, imageManager]);

  if (error) {
    if (fallbackSrc) {
      return <img ref={containerRef as any} src={fallbackSrc} alt={alt} className={className} {...props} />;
    }
    return (
      <div ref={containerRef as any} className={`bg-zinc-800 flex items-center justify-center ${className}`}>
        <span className="text-zinc-500 text-xs text-center px-2">{alt || 'Unavailable'}</span>
      </div>
    );
  }

  if (!loadedSrc && !prevLoadedSrc) {
    return placeholder ? (
      <div ref={containerRef as any} className="w-full h-full">{placeholder}</div>
    ) : (
      <div ref={containerRef as any} className={`bg-zinc-900 animate-pulse ${className}`} />
    );
  }

  return (
    <>
      {prevLoadedSrc && prevLoadedSrc !== loadedSrc && (
        <img 
          src={prevLoadedSrc} 
          alt={alt} 
          className={`absolute inset-0 transition-opacity duration-[800ms] opacity-0 ${className}`} 
          {...props} 
        />
      )}
      {loadedSrc && (
        <img 
          ref={containerRef as any}
          src={loadedSrc} 
          alt={alt} 
          className={`transition-opacity duration-[800ms] opacity-100 ${className}`} 
          {...props} 
        />
      )}
    </>
  );
};

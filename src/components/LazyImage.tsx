import React, { useState, useEffect, useRef } from 'react';
import { useImageManager, useRenderMetrics } from '../context/ServiceContext';
import { ImageManager } from '../core/rendering/ImageManager';
import { RenderMetrics } from '../core/rendering/RenderMetrics';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  placeholder?: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
}

export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  fallbackSrc, 
  placeholder,
  className = '',
  alt = '',
  priority = 'low' as 'high' | 'medium' | 'low',
  ...props 
}) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const startTime = useRef<number>(Date.now());
  const imageManager = useImageManager();
  const metrics = useRenderMetrics();
  
  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    let isMounted = true;
    setError(false);
    setLoadedSrc(null);
    startTime.current = Date.now();


    if (imageManager) {
      if (typeof imageManager.registerDisplay === 'function') {
        imageManager.registerDisplay(src);
      }
      imageManager.preloadImage(src, priority).then(resolvedSrc => {
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
  }, [src, priority, imageManager]);

  if (error) {
    if (fallbackSrc) {
      return <img src={fallbackSrc} alt={alt} className={className} {...props} />;
    }
    return (
      <div className={`bg-zinc-800 flex items-center justify-center ${className}`}>
        <span className="text-zinc-500 text-xs text-center px-2">{alt || 'Unavailable'}</span>
      </div>
    );
  }

  if (!loadedSrc) {
    return placeholder ? (
      <>{placeholder}</>
    ) : (
      <div className={`bg-zinc-900 animate-pulse ${className}`} />
    );
  }

  return (
    <img 
      src={loadedSrc} 
      alt={alt} 
      className={`transition-opacity duration-300 opacity-100 ${className}`} 
      {...props} 
    />
  );
};

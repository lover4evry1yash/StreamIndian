import sys

with open('src/components/LazyImage.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""export const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  fallbackSrc, 
  placeholder,
  className = '',
  alt = '',
  priority = 'low' as 'high' | 'medium' | 'low',
  crossfade = false,
  ...props 
}) => {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);""",
"""export const LazyImage: React.FC<LazyImageProps> = ({ 
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
  const containerRef = useRef<HTMLDivElement | HTMLImageElement | null>(null);""")

content = content.replace(
"""  useEffect(() => {
    if (!src) {
      setError(true);
      return;
    }

    let isMounted = true;
    setError(false);
    setLoadedSrc(null);
    startTime.current = Date.now();""",
"""  useEffect(() => {
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
    startTime.current = Date.now();""")

content = content.replace(
"""    return () => {
      isMounted = false;
      if (imageManager && typeof imageManager.unregisterDisplay === 'function') {
        imageManager.unregisterDisplay(src);
      }
    };
  }, [src, imageManager, crossfade]);""",
"""    return () => {
      isMounted = false;
      if (imageManager && typeof imageManager.unregisterDisplay === 'function') {
        imageManager.unregisterDisplay(src);
      }
    };
  }, [src, imageManager, crossfade, isVisible]);""")

content = content.replace(
"""  if (error) {
    if (fallbackSrc) {
      return <img src={fallbackSrc} alt={alt} className={className} {...props} />;
    }
    return (
      <div className={`bg-zinc-800 flex items-center justify-center ${className}`}>
        <span className="text-zinc-500 text-xs text-center px-2">{alt || 'Unavailable'}</span>
      </div>
    );
  }

  if (!loadedSrc && !prevLoadedSrc) {
    return placeholder ? (
      <>{placeholder}</>
    ) : (
      <div className={`bg-zinc-900 animate-pulse ${className}`} />
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
          src={loadedSrc} 
          alt={alt} 
          className={`transition-opacity duration-[800ms] opacity-100 ${className}`} 
          {...props} 
        />
      )}
    </>
  );""",
"""  if (error) {
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
  );""")

with open('src/components/LazyImage.tsx', 'w') as f:
    f.write(content)

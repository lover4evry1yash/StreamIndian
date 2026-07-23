import React, { useEffect, useState } from 'react';
import { MediaCard } from './MediaCard';
import { MediaItem } from '../types/tizen';
import { Sparkles } from 'lucide-react';
import { VirtualCarousel } from './VirtualCarousel';
import { usePlaybackManager } from '../context/ServiceContext';

interface MediaRowProps {
  title: string;
  subtitle?: string;
  items: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
  rowId: string;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  subtitle,
  items,
  onSelectMedia,
  rowId,
}) => {
  const playbackManager = usePlaybackManager();
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    if (items.length > 0 && playbackManager?.resumeManager) {
      const ids = items.map(i => i.id);
      playbackManager.resumeManager.getBatchResumePositions(ids).then(results => {
        if (isMounted) {
          setProgressMap(results);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [items, playbackManager]);

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-8 px-8">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-indigo-400" />
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/50">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="pb-4 pt-2">
        <VirtualCarousel
          items={items}
          itemWidth={200} // Based on MediaCard width (w-[200px])
          itemHeight={300} // Based on MediaCard height (h-[300px])
          gap={20}
          renderItem={(media: MediaItem, index, isVisible) => (
            <MediaCard
              key={media.id}
              media={media}
              onSelect={onSelectMedia}
              index={index}
              rowId={rowId}
              isVisible={isVisible}
              watchedProgressSeconds={progressMap[media.id] || 0}
            />
          )}
        />
      </div>
    </section>
  );
};

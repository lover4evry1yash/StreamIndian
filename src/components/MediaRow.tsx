import React, { useEffect, useState, useMemo } from 'react';
import { MediaItem } from '../types/tizen';
import { usePlaybackManager } from '../context/ServiceContext';
import { useSpatialFocus } from './SpatialFocusContainer';
import { TVRow, TVPoster, TVProgressBar } from '../design-system';

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
  const { focusedId } = useSpatialFocus();
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let isMounted = true;
    if (items.length > 0 && playbackManager?.historyService) {
      const ids = items.map(i => i.id);
      playbackManager.historyService.getBatchResumePositions(ids).then(results => {
        if (isMounted) {
          setProgressMap(results);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [items, playbackManager]);

  // Virtualization logic
  const renderWindow = useMemo(() => {
     let activeIndex = 0;
     if (focusedId && focusedId.startsWith(`${rowId}-media-`)) {
        const parts = focusedId.split('-');
        const idxStr = parts[parts.length - 1];
        if (!isNaN(Number(idxStr))) {
           activeIndex = parseInt(idxStr, 10);
        }
     }
     
     // Only render a window of 8 items before and 12 items after the focused index
     const start = Math.max(0, activeIndex - 8);
     const end = Math.min(items.length, activeIndex + 12);
     
     return { start, end };
  }, [focusedId, rowId, items.length]);

  if (!items || items.length === 0) return null;

  // Assuming item width 220px + 16px gap = 236px for spacer calculation on md
  // To avoid responsive issues, we'll just apply margin-left to the first visible item
  const marginLeft = renderWindow.start * 236; // rough estimate

  return (
    <TVRow title={title}>
      {renderWindow.start > 0 && (
         <div style={{ width: `${marginLeft}px`, flexShrink: 0 }} />
      )}
      
      {items.slice(renderWindow.start, renderWindow.end).map((media, indexOffset) => {
        const index = renderWindow.start + indexOffset;
        const cardId = `${rowId}-media-${media.mediaType}-${media.id}-${index}`;
        const totalDurationSeconds = (media.durationMinutes || 120) * 60;
        const progressPercent = Math.min(100, Math.round(((progressMap[media.id] || 0) / totalDurationSeconds) * 100));

        return (
          <div key={cardId} className="flex-shrink-0 w-[180px] md:w-[220px] relative">
            <TVPoster
              id={cardId}
              groupId="main"
              imageUrl={media.posterUrl}
              title={media.title}
              subtitle={media.genres.slice(0, 2).join(' • ')}
              onClick={() => onSelectMedia(media)}
              aspectRatio="poster"
            />
            {progressPercent > 0 && (
              <div className="absolute bottom-16 left-2 right-2 z-30">
                <TVProgressBar progress={progressPercent} />
              </div>
            )}
          </div>
        );
      })}
      
      {renderWindow.end < items.length && (
         <div style={{ width: `${(items.length - renderWindow.end) * 236}px`, flexShrink: 0 }} />
      )}
    </TVRow>
  );
};

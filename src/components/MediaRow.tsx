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

  if (!items || items.length === 0) return null;

  return (
    <TVRow title={title}>
      {items.map((media, index) => {
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
    </TVRow>
  );
};

/**
 * StreamIndian - TV Media Card Component
 * Optimized for distant viewing with high-contrast poster, language badge, and rating.
 */

import React from 'react';
import { FocusItem } from './FocusItem';
import { LazyImage } from './LazyImage';
import { MediaItem } from '../types/tizen';
import { Play, Star, Clock } from 'lucide-react';

interface MediaCardProps {
  media: MediaItem;
  rowId?: string;
  onSelect: (media: MediaItem) => void;
  index: number;
  isVisible?: boolean;
  watchedProgressSeconds?: number;
}

export const MediaCard: React.FC<MediaCardProps> = React.memo(({ media, onSelect, index, rowId, isVisible, watchedProgressSeconds = 0 }) => {
  const cardId = rowId ? `${rowId}-media-${media.mediaType}-${media.id}` : `media-card-${media.id}`;

  const totalDurationSeconds = (media.durationMinutes || 120) * 60;
  const progressPercent = Math.min(100, Math.round((watchedProgressSeconds / totalDurationSeconds) * 100));

  return (
    <FocusItem
      id={cardId}
      onClick={() => onSelect(media)}
      className="group relative flex-shrink-0 w-48 md:w-56 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-xl"
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#050506]">
        <LazyImage
          src={media.posterUrl}
          alt={media.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px] shadow-md uppercase tracking-wider">
            {media.language}
          </span>
          {media.imdbRating && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur text-indigo-400 font-bold text-[10px] flex items-center gap-1 border border-indigo-500/30">
              <Star className="w-3 h-3 fill-indigo-400 text-indigo-400" />
              {media.imdbRating}
            </span>
          )}
        </div>

        {/* Hover / Remote Focus Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-[#050506]/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-1.5 py-0.5 bg-white/10 text-zinc-300 rounded font-semibold border border-white/10">
              {media.rating}
            </span>
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              {media.durationMinutes}m
            </span>
          </div>

          <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {media.title}
          </h3>

          <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
            {media.genres.join(' • ')}
          </p>

          <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-indigo-400">
            <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
            <span>Play Stream</span>
          </div>
        </div>

        {/* Resume Progress Bar */}
        {progressPercent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-900">
            <div
              className="h-full bg-indigo-500 shadow-[0_0_8px_#4f46e5]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </FocusItem>
  );
});

MediaCard.displayName = 'MediaCard';

/**
 * StreamIndian - TV Watchlist & Recent History View
 */

import React, { useEffect, useState } from 'react';
import { MediaItem, HistoryRecord } from '../types/tizen';
import { StreamIndianStorage } from '../core/storage';
import { providerManager } from '../providers';
import { FocusItem } from './FocusItem';
import { LazyImage } from './LazyImage';
import { TVPoster } from '../design-system';
import { Bookmark, History, RotateCcw, Trash2 } from 'lucide-react';

interface WatchlistHistoryViewProps {
  onSelectMedia: (media: MediaItem) => void;
}

export const WatchlistHistoryView: React.FC<WatchlistHistoryViewProps> = ({ onSelectMedia }) => {
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  const [watchlistMedia, setWatchlistMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const history = StreamIndianStorage.getHistory();
    setHistoryRecords(history);

    const watchlistIds = StreamIndianStorage.getWatchlist();
    const catalog = await providerManager.getUnifiedCatalog();
    const savedItems = catalog.filter((item) => watchlistIds.includes(item.id));
    setWatchlistMedia(savedItems);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('streamindian_history_v1');
    setHistoryRecords([]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Resume Playing Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <History className="w-5 h-5" />
            <h2 className="text-xl font-bold text-white tracking-tight">Continue Watching</h2>
          </div>
          {historyRecords.length > 0 && (
            <FocusItem
              id="clear-history-btn"
              onClick={handleClearHistory}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 text-xs font-bold border border-white/10 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </FocusItem>
          )}
        </div>

        {historyRecords.length === 0 ? (
          <div className="p-8 bg-white/5 rounded-2xl border border-white/10 text-center text-zinc-500 text-xs">
            No watch history recorded yet. Start watching Indian cinema titles to resume playback position anytime.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {historyRecords.map((rec) => (
              <div
                key={rec.mediaId}
                className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 group"
              >
                <LazyImage
                  src={rec.posterUrl}
                  alt={rec.title}
                  className="w-16 h-22 object-cover rounded-xl shadow-md flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-400 font-bold uppercase border border-indigo-500/30">
                    {rec.language}
                  </span>
                  <h4 className="text-sm font-bold text-white truncate mt-1">{rec.title}</h4>
                  <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1 font-mono">
                    <RotateCcw className="w-3 h-3 text-indigo-400" />
                    Paused at {Math.floor(rec.watchedDurationSeconds / 60)}m
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Watchlist Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 border-b border-white/10 pb-3">
          <Bookmark className="w-5 h-5 fill-indigo-400 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">Your Watchlist</h2>
        </div>

        {watchlistMedia.length === 0 ? (
          <div className="p-8 bg-white/5 rounded-2xl border border-white/10 text-center text-zinc-500 text-xs">
            Your watchlist is empty. Add titles from the Home or Search pages!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {watchlistMedia.map((media, idx) => (
              <div key={media.id} className="w-full">
                <TVPoster
                  id={`watchlist-media-${media.id}`}
                  groupId="watchlist"
                  imageUrl={media.posterUrl}
                  title={media.title}
                  subtitle={media.genres.join(' • ')}
                  onClick={() => onSelectMedia(media)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

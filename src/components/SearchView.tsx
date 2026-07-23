/**
 * StreamIndian - TV Search & Discovery View
 * Remote-friendly keyboard and instant title/cast/genre filtering.
 */
import React, { useState, useEffect, useRef } from 'react';
import { FocusItem } from './FocusItem';
import { MediaCard } from './MediaCard';
import { MediaItem } from '../types/tizen';
import { Search, Sparkles, Filter, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { useSearchManager, useEventBus } from '../context/ServiceContext';
import { SearchManager, SearchQuery, SearchResult, SearchResultItem, SearchError, SearchHistoryItem, SearchEventType } from '../core/search';
import { EventBus } from '../core/EventBus';
import { Movie, Series } from '../core/models/DomainModels';

interface SearchViewProps {
  onSelectMedia: (media: MediaItem) => void;
  selectedLanguage: string;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSelectMedia, selectedLanguage }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);

  const searchManager = useSearchManager();
  const eventBus = useEventBus();

  useEffect(() => {
    // Load search history initially
    searchManager.getHistory().then(setHistory);

    const handleSearchStarted = (e: { query: SearchQuery }) => {
      setLoading(true);
      setError(null);
    };

    const handleSearchCompleted = (e: { query: SearchQuery; results: SearchResult }) => {
      setLoading(false);
      setError(null);
      
      // Map Domain Models (SearchResultItem) back to legacy MediaItem for App.tsx compatibility
      const mappedResults: MediaItem[] = e.results.items.map((item: any) => {
        const isMovie = item.durationMinutes !== undefined;
        return {
          id: item.id,
          mediaType: item.mediaType || (isMovie ? 'movie' : 'series'),
          title: item.title,
          originalTitle: item.originalTitle,
          language: selectedLanguage === 'All' ? 'Hindi' : selectedLanguage as any, // fallback
          year: item.releaseDate ? parseInt(item.releaseDate.substring(0, 4)) : (item.firstAirDate ? parseInt(item.firstAirDate.substring(0, 4)) : 2024),
          durationMinutes: item.durationMinutes || 120,
          rating: item.ratings?.[0]?.score ? `${item.ratings[0].score}/10` : 'U/A 13+',
          imdbRating: item.ratings?.[0]?.score,
          genres: item.genres?.map((g: any) => g.name) || [],
          posterUrl: item.artwork?.posters?.[0]?.url || '',
          backdropUrl: item.artwork?.backdrops?.[0]?.url || '',
          description: item.overview || '',
          cast: item.credits?.cast?.slice(0, 3).map((c: any) => c.name) || [],
          director: item.credits?.crew?.find((c: any) => c.role === 'Director')?.name || 'Unknown',
          provider: 'TMDB',
          streams: []
        };
      });

      setResults(mappedResults);
      searchManager.getHistory().then(setHistory);
    };

    const handleSearchFailed = (e: { query: SearchQuery; error: SearchError }) => {
      setLoading(false);
      setError(e.error);
      setResults([]);
    };

    const handleSearchCancelled = () => {
      setLoading(false);
      setError(null);
      if (!query) setResults([]);
    };

    eventBus.on(SearchEventType.SEARCH_STARTED, handleSearchStarted);
    eventBus.on(SearchEventType.SEARCH_COMPLETED, handleSearchCompleted);
    eventBus.on(SearchEventType.SEARCH_FAILED, handleSearchFailed);
    eventBus.on(SearchEventType.SEARCH_CANCELLED, handleSearchCancelled);

    return () => {
      eventBus.off(SearchEventType.SEARCH_STARTED, handleSearchStarted);
      eventBus.off(SearchEventType.SEARCH_COMPLETED, handleSearchCompleted);
      eventBus.off(SearchEventType.SEARCH_FAILED, handleSearchFailed);
      eventBus.off(SearchEventType.SEARCH_CANCELLED, handleSearchCancelled);
    };
  }, [searchManager, eventBus, query, selectedLanguage]);

  useEffect(() => {
    if (query.trim().length > 0) {
      searchManager.searchDebounced({
        query: query,
        language: selectedLanguage === 'All' ? undefined : selectedLanguage,
        page: 1
      });
    } else {
      setResults([]);
      setError(null);
      setLoading(false);
    }
  }, [query, selectedLanguage, searchManager]);

  const handleClearHistory = async () => {
    await searchManager.clearHistory();
    setHistory([]);
  };

  const quickQueryTags = ['Sci-Fi', 'Thriller', 'Action', 'Comedy', 'Horror', 'Drama', 'Mythology'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Search Input Box */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3 shadow-xl backdrop-blur-xl focus-within:ring-2 focus-within:ring-indigo-500">
          <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Indian Movies, Directors, Cast (e.g., Prabhas, Kalki, Vijay Sethupathi)..."
            className="w-full bg-transparent text-white placeholder-zinc-500 font-semibold text-sm outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs font-bold text-zinc-400 hover:text-white px-2 py-1 bg-white/10 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Quick Search Genre Chips */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
        <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-indigo-400" /> Genres:
        </span>
        {quickQueryTags.map((tag) => (
          <FocusItem
            key={`tag-${tag}`}
            id={`search-tag-${tag}`}
            onClick={() => setQuery(tag)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              query === tag
                ? 'bg-indigo-600 text-white font-black shadow-[0_0_12px_rgba(79,70,229,0.4)]'
                : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
            }`}
          >
            {tag}
          </FocusItem>
        ))}
      </div>

      {/* Main Content Area: History or Results */}
      {!query && history.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Recent Searches
            </h3>
            <FocusItem
              id="clear-history-btn"
              onClick={handleClearHistory}
              className="flex items-center gap-1 text-xs text-rose-400 font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </FocusItem>
          </div>
          <div className="flex flex-wrap gap-3">
            {history.map((item) => (
              <FocusItem
                key={item.id}
                id={`history-${item.id}`}
                onClick={() => setQuery(item.query)}
                className="px-4 py-2 rounded-xl bg-white/5 text-sm font-bold text-zinc-300 border border-white/10 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-zinc-500" />
                {item.query}
              </FocusItem>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mt-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              {query ? `Search Results for "${query}"` : 'Recommended Indian Titles'}
            </h3>
            <span className="text-xs text-zinc-400 font-semibold">{results.length} Titles Found</span>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-indigo-400 font-bold text-sm tracking-wider">Searching Catalog...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-rose-400 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 mb-2" />
              <p className="text-base font-bold">Search Failed</p>
              <p className="text-xs text-zinc-400">{error.message}</p>
            </div>
          ) : results.length === 0 && query ? (
            <div className="py-20 text-center text-zinc-500 space-y-2">
              <p className="text-base font-bold text-zinc-400">No matching titles found for "{query}"</p>
              <p className="text-xs">Try searching for keywords like "Action", "Prabhas", "Malayalam", or "Kalki".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {results.map((media, idx) => (
                <MediaCard
                  key={media.id}
                  media={media}
                  onSelect={onSelectMedia}
                  index={idx}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

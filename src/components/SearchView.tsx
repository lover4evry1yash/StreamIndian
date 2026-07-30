/**
 * StreamIndian - TV Search & Discovery View
 * Remote-friendly keyboard and instant title/cast/genre filtering.
 */
import React, { useState, useEffect } from 'react';
import { FocusItem } from './FocusItem';
import { TVPoster } from '../design-system';
import { MediaItem } from '../types/tizen';
import { Search, Sparkles, Filter, Clock, Trash2, AlertTriangle } from 'lucide-react';
import { useSearchViewModel } from '../context/ServiceContext';
import { SearchHistoryItem } from '../core/search';

interface SearchViewProps {
  onSelectMedia: (media: MediaItem) => void;
  selectedLanguage: string;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSelectMedia, selectedLanguage }) => {
  const searchViewModel = useSearchViewModel();
  const [, setRevision] = useState(0);

  const query = searchViewModel.getQuery();
  const results = searchViewModel.getResults();
  const history = searchViewModel.getHistory();
  const loading = searchViewModel.isLoading();
  const error = searchViewModel.getError();

  useEffect(() => {
    searchViewModel.loadHistory().then(() => setRevision(r => r + 1));
  }, [searchViewModel]);

  const setQuery = (newQuery: string) => {
    searchViewModel.setQuery(newQuery, selectedLanguage, () => {
      setRevision(r => r + 1);
    });
  };

  const handleClearHistory = async () => {
    await searchViewModel.clearHistory();
    setRevision(r => r + 1);
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
              <p className="text-xs text-zinc-400">{error}</p>
            </div>
          ) : results.length === 0 && query ? (
            <div className="py-20 text-center text-zinc-500 space-y-2">
              <p className="text-base font-bold text-zinc-400">No matching titles found for "{query}"</p>
              <p className="text-xs">Try searching for keywords like "Action", "Prabhas", "Malayalam", or "Kalki".</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {results.map((media, idx) => (
                <div key={media.id} className="w-full">
                  <TVPoster
                    id={`search__media__${media.mediaType}__${media.id}`}
                    groupId="search-results"
                    imageUrl={media.posterUrl}
                    title={media.title}
                    subtitle={media.genres.join(' • ')}
                    onClick={() => onSelectMedia(media)}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

import { StreamSelectionView } from './components/StreamSelectionView';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, Suspense } from 'react';
import { SkeletonDetails } from './components/SkeletonRenderer';
import { SpatialFocusProvider } from './components/SpatialFocusContainer';
import { FocusItem } from './components/FocusItem';
import { LazyImage } from './components/LazyImage';
import { TVNavbar } from './components/TVNavbar';
import { MediaRow } from './components/MediaRow';
const UniversalMediaDetailView = React.lazy(() => import('./components/UniversalMediaDetailView').then(module => ({ default: module.UniversalMediaDetailView })));
const TVPlayer = React.lazy(() => import('./components/TVPlayer').then(module => ({ default: module.TVPlayer })));
import { OnScreenRemote } from './components/OnScreenRemote';
const AuditPanel = React.lazy(() => import('./components/AuditPanel').then(module => ({ default: module.AuditPanel })));
const SearchView = React.lazy(() => import('./components/SearchView').then(module => ({ default: module.SearchView })));
const WatchlistHistoryView = React.lazy(() => import('./components/WatchlistHistoryView').then(module => ({ default: module.WatchlistHistoryView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then(module => ({ default: module.SettingsView })));
import { MediaItem, StreamSource } from './types/tizen';
import { providerManager } from './providers';
import { tizenKeyController } from './core/tizenKeys';
import { Play, Info, Star, Film, Sparkles } from 'lucide-react';
import { useRenderMetrics } from './context/ServiceContext';
import { RenderBudget } from './core/rendering/RenderMetrics';




const appRenderBudget: RenderBudget = {
  maxCards: 50,
  maxImages: 40,
  maxRenderTimeMs: 100,
  maxMemoryMB: 100
};

export default function App() {
  const [activeTab, setActiveTab] = useState('nav-home');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [catalog, setCatalog] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  
  // Playback state

  const [streamSelectionMedia, setStreamSelectionMedia] = useState<{
    media: MediaItem;
    startPosition: number;
  } | null>(null);

  const [activePlayback, setActivePlayback] = useState<{
    media: MediaItem;
    stream: StreamSource;
    startTimeSeconds: number;
  } | null>(null);

  const isTizenNative = tizenKeyController.isNativeTizen();
  const metrics = useRenderMetrics();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
         setActiveTab(prev => prev === 'nav-audit' ? 'nav-home' : 'nav-audit');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  useEffect(() => {
    loadCatalog();
    if (metrics) {
      metrics.registerBudget('AppHome', appRenderBudget);
      metrics.validateBudget('AppHome', { cards: catalog.length });
    }
  }, [selectedLanguage, catalog.length, metrics]);

  const loadCatalog = async () => {
    const items = await providerManager.getUnifiedCatalog(selectedLanguage);
    setCatalog(items);
  };

  const handleStartPlayback = (media: MediaItem, stream: StreamSource, startTimeSeconds: number) => {
    setSelectedMedia(null);
    setActivePlayback({ media, stream, startTimeSeconds });
  };

  const heroItem = catalog.find((m) => m.isRegionalHero || m.isTrending) || catalog[0];

  const trendingItems = catalog.filter((m) => m.isTrending);
  const trendingMovies = trendingItems.filter(m => m.mediaType === 'movie');
  const trendingSeries = trendingItems.filter(m => m.mediaType === 'series');
  const popularMovies = catalog.filter(m => m.mediaType === 'movie' && m.imdbRating && m.imdbRating > 8);
  const popularSeries = catalog.filter(m => m.mediaType === 'series' && m.imdbRating && m.imdbRating > 8);
  const anime = catalog.filter(m => m.mediaType === 'anime' || m.genres.includes('Animation'));
  const indianMovies = catalog.filter(m => m.mediaType === 'movie' && ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi'].includes(m.language));
  const indianSeries = catalog.filter(m => m.mediaType === 'series' && ['Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Punjabi'].includes(m.language));
  const recentlyAdded = catalog.slice().sort((a,b) => b.year - a.year);
  const recommended = catalog.filter(m => !m.isTrending);
  const topRated = catalog.slice().sort((a,b) => (b.imdbRating || 0) - (a.imdbRating || 0));
  const discover = catalog.slice(0, 10); // Random sample in real app
  const southItems = catalog.filter((m) => ['Tamil', 'Telugu', 'Malayalam', 'Kannada'].includes(m.language));
  const northWestItems = catalog.filter((m) => ['Hindi', 'Marathi', 'Bengali', 'Punjabi'].includes(m.language));

  return (
    <SpatialFocusProvider
      onBackKey={() => {
        if (activePlayback) {
          setActivePlayback(null);
        } else if (selectedMedia) {
          setSelectedMedia(null);
        } else if (activeTab !== 'nav-home') {
          setActiveTab('nav-home');
        }
      }}
    >
      <div className="min-h-screen bg-[#050506] text-zinc-100 font-sans selection:bg-indigo-600 selection:text-white pb-20 pl-20 overflow-x-hidden">
        {/* TV Header Navigation */}
        <TVNavbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedLanguage={selectedLanguage}
          onLanguageSelect={(lang) => {
            setSelectedLanguage(lang);
            setActiveTab('nav-home');
          }}
          isTizenNative={isTizenNative}
        />

        {/* Tab Views */}
        {activeTab === 'nav-home' && (
          <main className="space-y-6">
            {/* Spotlight Hero Banner */}
            {heroItem && (
              <section className="relative w-full h-[65vh] md:h-[70vh] bg-[#050506] overflow-hidden flex items-end p-8 md:p-12 border-b border-white/10">
                {/* Hero Backdrop Image */}
                <LazyImage
                  src={heroItem.backdropUrl || heroItem.posterUrl}
                  alt={heroItem.title}
                  className="absolute inset-0 w-full h-full object-cover object-top opacity-50 scale-105 filter brightness-90"
                  priority="high"
                />

                {/* Dark Vignette Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-[#050506]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050506] via-[#050506]/40 to-transparent" />

                {/* Hero Information */}
                <div className="relative z-10 max-w-3xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-md bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest shadow-md">
                      {heroItem.language} Blockbuster
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur text-indigo-400 font-bold text-xs flex items-center gap-1 border border-indigo-500/30">
                      <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                      {heroItem.imdbRating} IMDb
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-zinc-300 font-semibold text-xs border border-white/10">
                      {heroItem.rating}
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-lg">
                    {heroItem.title}
                  </h1>

                  <p className="text-xs md:text-sm text-zinc-300 leading-relaxed line-clamp-3 max-w-2xl">
                    {heroItem.description}
                  </p>

                  {/* Remote Focusable Action Buttons */}
                  <div className="flex items-center gap-4 pt-2">
                    {heroItem.streams.length > 0 && (
                      <FocusItem
                        id="hero-play-btn"
                        onClick={() => setStreamSelectionMedia({ media: heroItem, startPosition: 0 })}
                        className="px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.5)] border border-indigo-400/50"
                      >
                        <Play className="w-5 h-5 fill-white" />
                        <span>Watch Now</span>
                      </FocusItem>
                    )}

                    <FocusItem
                      id="hero-details-btn"
                      onClick={() => setSelectedMedia(heroItem)}
                      className="px-5 py-3.5 rounded-2xl bg-white/10 text-zinc-200 font-bold text-sm flex items-center gap-2 border border-white/10 hover:text-white hover:bg-white/20"
                    >
                      <Info className="w-5 h-5 text-indigo-400" />
                      <span>More Info</span>
                    </FocusItem>
                  </div>
                </div>
              </section>
            )}

            {/* Categorized TV Rows */}
            <div className="space-y-6 pb-20">
              {trendingMovies.length > 0 && <MediaRow rowId="row-trending-movies" title="Trending Movies" subtitle="Current hits" items={trendingMovies} onSelectMedia={setSelectedMedia} />}
              {trendingSeries.length > 0 && <MediaRow rowId="row-trending-series" title="Trending Series" subtitle="Binge-worthy shows" items={trendingSeries} onSelectMedia={setSelectedMedia} />}
              {popularMovies.length > 0 && <MediaRow rowId="row-popular-movies" title="Popular Movies" subtitle="Fan favorites" items={popularMovies} onSelectMedia={setSelectedMedia} />}
              {popularSeries.length > 0 && <MediaRow rowId="row-popular-series" title="Popular Series" subtitle="Highly rated TV" items={popularSeries} onSelectMedia={setSelectedMedia} />}
              {indianMovies.length > 0 && <MediaRow rowId="row-indian-movies" title="Indian Movies" subtitle="Across all languages" items={indianMovies} onSelectMedia={setSelectedMedia} />}
              {indianSeries.length > 0 && <MediaRow rowId="row-indian-series" title="Indian Series" subtitle="Regional and national hits" items={indianSeries} onSelectMedia={setSelectedMedia} />}
              {recentlyAdded.length > 0 && <MediaRow rowId="row-recent" title="Recently Added" subtitle="Fresh content" items={recentlyAdded} onSelectMedia={setSelectedMedia} />}
              {topRated.length > 0 && <MediaRow rowId="row-top-rated" title="Top Rated" subtitle="Critically acclaimed" items={topRated} onSelectMedia={setSelectedMedia} />}
            </div>
          </main>
        )}

        <Suspense fallback={<div className="p-12"><div className="animate-pulse bg-white/10 w-full h-32 rounded-xl" /></div>}>
        {activeTab === 'nav-search' && (
          <SearchView
            onSelectMedia={setSelectedMedia}
            selectedLanguage={selectedLanguage}
          />
        )}
        </Suspense>
        

        <Suspense fallback={<div />}>{activeTab === 'nav-watchlist' && <WatchlistHistoryView onSelectMedia={setSelectedMedia} />}</Suspense>

        <Suspense fallback={<div />}>{activeTab === 'nav-audit' && <AuditPanel />}</Suspense>

        <Suspense fallback={<div />}>{activeTab === 'nav-settings' && <SettingsView />}</Suspense>

        {/* Media Detail Modal */}
        
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#050506]/95"><SkeletonDetails /></div>}>
        {selectedMedia && (
          <UniversalMediaDetailView
            mediaId={selectedMedia.id}
            mediaType={selectedMedia.mediaType}
            onClose={() => setSelectedMedia(null)}
            onPlay={(media, startPosition) => {
              setStreamSelectionMedia({ media, startPosition: startPosition || 0 });
            }}
          />
        )}
        </Suspense>
        

        
        {streamSelectionMedia && (
          <StreamSelectionView
            media={streamSelectionMedia.media}
            onClose={() => setStreamSelectionMedia(null)}
            onStreamSelected={(stream) => {
              handleStartPlayback(streamSelectionMedia.media, stream, streamSelectionMedia.startPosition);
              setStreamSelectionMedia(null);
            }}
          />
        )}

        {/* Fullscreen TV Player */}
        
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
        {activePlayback && (
          <TVPlayer
            media={activePlayback.media}
            stream={activePlayback.stream}
            startTimeSeconds={activePlayback.startTimeSeconds}
            onClose={() => setActivePlayback(null)}
          />
        )}
        </Suspense>
        

        {/* On-Screen Smart TV Remote Control (for Browser Testing) */}
        <OnScreenRemote />
      </div>
    </SpatialFocusProvider>
  );
}

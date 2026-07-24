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
import { tizenKeyController } from './core/tizenKeys';
import { TVHero, TVButton } from './design-system';
import { Play, Info, Star } from 'lucide-react';
import { useRenderMetrics, useHomeViewModel } from './context/ServiceContext';
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
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  
  const homeViewModel = useHomeViewModel();
  
  // Playback state

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
      metrics.validateBudget('AppHome', { cards: homeViewModel.getCatalog().length });
    }
  }, [selectedLanguage, metrics, homeViewModel]);

  const loadCatalog = async () => {
    await homeViewModel.load(selectedLanguage);
    setCatalogRevision(r => r + 1);
  };

  const handleStartPlayback = (media: MediaItem, stream: StreamSource, startTimeSeconds: number) => {
    setSelectedMedia(null);
    setActivePlayback({ media, stream, startTimeSeconds });
  };

  const heroItem = homeViewModel.getHero();
  const shelves = homeViewModel.getShelves();

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
              <TVHero
                title={heroItem.title}
                subtitle={`${heroItem.language} • ${heroItem.genres.join(', ')} • ${heroItem.rating}`}
                description={heroItem.description}
                imageUrl={heroItem.backdropUrl || heroItem.posterUrl}
                actions={
                  <>
                    {heroItem.streams.length > 0 && (
                      <TVButton
                        id="hero-play-btn"
                        onClick={() => setSelectedMedia(heroItem)}
                        icon={<Play className="w-6 h-6 fill-black" />}
                        variant="primary"
                        size="lg"
                      >
                        Watch Now
                      </TVButton>
                    )}
                    <TVButton
                      id="hero-details-btn"
                      onClick={() => setSelectedMedia(heroItem)}
                      icon={<Info className="w-6 h-6" />}
                      variant="secondary"
                      size="lg"
                    >
                      More Info
                    </TVButton>
                  </>
                }
              />
            )}

            {/* Categorized TV Shelves */}
            <div className="pb-20">
              {shelves.map(shelf => (
                <MediaRow key={shelf.id} rowId={shelf.id} title={shelf.title} subtitle={shelf.subtitle || ''} items={shelf.items} onSelectMedia={setSelectedMedia} />
              ))}
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
            onPlay={(media, stream, startPosition) => {
              handleStartPlayback(media, stream, startPosition || 0);
            }}
            onSelectRelated={setSelectedMedia}
          />
        )}
        </Suspense>
        
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

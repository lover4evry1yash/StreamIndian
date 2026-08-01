/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, Suspense } from 'react';
import { SkeletonDetails } from './components/SkeletonRenderer';
import { Bootstrap } from './core/Bootstrap';
import { SpatialFocusProvider } from './components/SpatialFocusContainer';
import { FocusItem } from './components/FocusItem';
import { LazyImage } from './components/LazyImage';
import { TVNavbar } from './components/TVNavbar';
import { MediaRow } from './components/MediaRow';
import { FeatureLoader } from './core/FeatureLoader';
const UniversalMediaDetailView = FeatureLoader.load('details', () => import('./components/UniversalMediaDetailView').then(module => ({ default: module.UniversalMediaDetailView })));
const TVPlayer = FeatureLoader.load('playback', () => import('./components/TVPlayer').then(module => ({ default: module.TVPlayer })));
const OnScreenRemote = FeatureLoader.load('remote', () => import('./components/OnScreenRemote').then(module => ({ default: module.OnScreenRemote })));
const AuditPanel = FeatureLoader.load('audit', () => import('./components/AuditPanel').then(module => ({ default: module.AuditPanel })));
const SearchView = FeatureLoader.load('search', () => import('./components/SearchView').then(module => ({ default: module.SearchView })));
const WatchlistHistoryView = FeatureLoader.load('watchlist', () => import('./components/WatchlistHistoryView').then(module => ({ default: module.WatchlistHistoryView })));
const SettingsView = FeatureLoader.load('settings', () => import('./components/SettingsView').then(module => ({ default: module.SettingsView })));
const IPTVView = FeatureLoader.load('iptv', () => import('./components/IPTVView').then(module => ({ default: module.IPTVView })));

import { MediaItem, StreamSource, PlaybackReadiness } from './types/tizen';
import { tizenKeyController } from './core/tizenKeys';
import { TVHero, TVButton } from './design-system';
import { Play, Info, Star } from 'lucide-react';
import { useRenderMetrics, useHomeViewModel, useNavigationManager, useEventBus } from './context/ServiceContext';
import { RenderBudget } from './core/rendering/RenderMetrics';
import { Route } from './core/navigation/Router';



const appRenderBudget: RenderBudget = {
  maxCards: 50,
  maxImages: 40,
  maxRenderTimeMs: 100,
  maxMemoryMB: 100
};

export default function App() {
  const navManager = useNavigationManager();
  const eventBus = useEventBus();

  const [activeTab, setActiveTab] = useState('nav-home');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [catalogRevision, setCatalogRevision] = useState(0);

  // Modals state derived from NavigationManager
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

  // Sync NavigationManager state with React state
  useEffect(() => {
    // Initial sync
    const currentRoute = navManager.router.getCurrentRoute();
    if (currentRoute) {
      setActiveTab(currentRoute.id);
    } else {
      navManager.openRoute('nav-home', undefined, false);
    }

    const onRouteChanged = (route: Route) => {
      setActiveTab(route.id);
    };

    const onModalOpened = ({ modalId, data }: { modalId: string; data?: any }) => {
      if (modalId === 'media-details') {
        setSelectedMedia(data.media);
      } else if (modalId === 'player') {
        setActivePlayback(data);
      }
    };

    const onModalClosed = ({ modalId }: { modalId: string }) => {
      if (modalId === 'media-details') {
        setSelectedMedia(null);
      } else if (modalId === 'player') {
        setActivePlayback(null);
      }
    };

    eventBus.on('ROUTE_CHANGED', onRouteChanged);
    eventBus.on('MODAL_OPENED', onModalOpened);
    eventBus.on('MODAL_CLOSED', onModalClosed);

    return () => {
      eventBus.off('ROUTE_CHANGED', onRouteChanged);
      eventBus.off('MODAL_OPENED', onModalOpened);
      eventBus.off('MODAL_CLOSED', onModalClosed);
    };
  }, [navManager, eventBus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
         if (activeTab === 'nav-audit') {
           navManager.handleBack();
         } else {
           navManager.openRoute('nav-audit');
         }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, navManager]);

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
    navManager.openModal('player', { media, stream, startTimeSeconds });
  };

  const heroItem = homeViewModel.getHero();
  const shelves = homeViewModel.getShelves();

  return (
    <SpatialFocusProvider>
      <div className="min-h-screen bg-[#050506] text-zinc-100 font-sans selection:bg-indigo-600 selection:text-white pb-20 pl-20 overflow-x-hidden">
        {/* TV Header Navigation */}
        <TVNavbar
          activeTab={activeTab}
          onTabChange={(tabId) => navManager.openRoute(tabId)}
          selectedLanguage={selectedLanguage}
          onLanguageSelect={(lang) => {
            setSelectedLanguage(lang);
            navManager.openRoute('nav-home');
          }}
          isTizenNative={isTizenNative}
        />

        {/* Tab Views */}
        {['nav-home', 'nav-movies', 'nav-series', 'nav-anime'].includes(activeTab) && (
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
                        onClick={() => navManager.openModal('media-details', { media: heroItem })}
                        icon={<Play className="w-6 h-6 fill-black" />}
                        variant="primary"
                        size="lg"
                      >
                        Watch Now
                      </TVButton>
                    )}
                    <TVButton
                      id="hero-details-btn"
                      onClick={() => navManager.openModal('media-details', { media: heroItem })}
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
              {shelves.filter(shelf => {
                if (activeTab === 'nav-movies') return shelf.id.includes('movie');
                if (activeTab === 'nav-series') return shelf.id.includes('series');
                if (activeTab === 'nav-anime') return shelf.id.includes('anime') || shelf.title.toLowerCase().includes('anime');
                if (activeTab === 'nav-livetv') return shelf.id.includes('livetv');
                return true;
              }).map(shelf => (
                <MediaRow key={shelf.id} rowId={shelf.id} title={shelf.title} subtitle={shelf.subtitle || ''} items={shelf.items} onSelectMedia={(media) => navManager.openModal('media-details', { media })} />
              ))}
            </div>
          </main>
        )}

        <Suspense fallback={<div className="p-12"><div className="animate-pulse bg-white/10 w-full h-32 rounded-xl" /></div>}>
        {activeTab === 'nav-search' && (
          <SearchView
            onSelectMedia={(media) => navManager.openModal('media-details', { media })}
            selectedLanguage={selectedLanguage}
          />
        )}
        </Suspense>


        <Suspense fallback={<div />}>{activeTab === 'nav-watchlist' && <WatchlistHistoryView onSelectMedia={(media) => navManager.openModal('media-details', { media })} />}</Suspense>
        <Suspense fallback={<div />}>{activeTab === 'nav-livetv' && <IPTVView onSelectChannel={(channel) => {
           const media: MediaItem = {
              id: channel.id,
              title: channel.name, originalTitle: channel.name,
              mediaType: 'movie',
              language: 'English',
              year: new Date().getFullYear(),
              durationMinutes: 0,
              rating: '',
              imdbRating: 0,
              genres: [channel.group || 'Live TV'],
              posterUrl: channel.logo || '',
              backdropUrl: channel.logo || '',
              description: 'Live TV Channel',
              cast: [],
              director: '',
              provider: 'iptv',
              isTrending: false,
              isRegionalHero: false,
              streams: [{
                 id: channel.id,
                 url: channel.streamUrl,
                 quality: '1080p FHD',
                 providerName: 'IPTV',
                 format: 'HLS',
                 isLegalPublicStream: false,
                 readiness: PlaybackReadiness.DIRECT
              }]
           };
           handleStartPlayback(media, media.streams[0], 0);
        }} />}</Suspense>

        <Suspense fallback={<div />}>{activeTab === 'nav-audit' && <AuditPanel />}</Suspense>

        <Suspense fallback={<div />}>{activeTab === 'nav-settings' && <SettingsView />}</Suspense>

        {/* Media Detail Modal */}

        <Suspense fallback={<div className="fixed inset-0 z-50 bg-[#050506]/95"><SkeletonDetails /></div>}>
        {selectedMedia && (
          <UniversalMediaDetailView
            mediaId={selectedMedia.id}
            mediaType={selectedMedia.mediaType}
            initialMedia={selectedMedia}
            onClose={() => navManager.closeModal('media-details')}
            onPlay={(media, stream, startPosition) => {
              handleStartPlayback(media, stream, startPosition || 0);
            }}
            onSelectRelated={(media) => navManager.openModal('media-details', { media })}
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
            onClose={() => navManager.closeModal('player')}
          />
        )}
        </Suspense>


        {/* On-Screen Smart TV Remote Control (for Browser Testing) */}
        <OnScreenRemote />
      </div>
    </SpatialFocusProvider>
  );
}

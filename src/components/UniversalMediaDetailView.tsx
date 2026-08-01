import React, { useEffect, useState, useRef } from 'react';
import { Play, RotateCcw, Plus, Check, X, Star, Clock, Film } from 'lucide-react';
import { useSpatialFocus } from './SpatialFocusContainer';
import { FocusItem } from './FocusItem';
import { useEventBus, useMediaDetailsManager, useMediaDetailsViewModel, useHomeViewModel } from '../context/ServiceContext';
import { MediaDetailsEventType, MediaDetails, MediaSection, MediaAction, MediaActionType } from '../core/details';
import { TVHero, TVButton, TVRow, TVPoster, TVBadge } from '../design-system';
import { LazyImage } from './LazyImage';
import { StreamSection } from './StreamSection';
import { RelatedShelfEngine } from '../core/home/ShelfArchitecture';
import { MediaItem, StreamSource } from '../types/tizen';
import { MediaSearchQuery } from '../core/streams/types';

interface Props {
  mediaId: string;
  mediaType: 'movie' | 'series' | 'anime';
  initialMedia?: MediaItem;
  onClose: () => void;
  onPlay?: (media: MediaItem, stream: StreamSource, startPosition?: number) => void;
  onSelectRelated?: (media: MediaItem) => void;
}

export const UniversalMediaDetailView: React.FC<Props> = ({ mediaId, mediaType, initialMedia, onClose, onPlay, onSelectRelated }) => {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<MediaSection[]>([]);
  const [actions, setActions] = useState<MediaAction[]>([]);
  const [artwork, setArtwork] = useState<{ poster?: any, backdrop?: any, logo?: any }>({});
  
  const { registerGroup, setActiveGroup, setFocusedId } = useSpatialFocus();
  const eventBus = useEventBus();
  const manager = useMediaDetailsManager();
  const viewModel = useMediaDetailsViewModel();
  const homeViewModel = useHomeViewModel();
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasAutofocused, setHasAutofocused] = useState(false);
  const [pendingStreamFocus, setPendingStreamFocus] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<any | null>(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = () => {
      userInteractedRef.current = true;
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  useEffect(() => {
    if (actions.length > 0 && !hasAutofocused && !userInteractedRef.current) {
      // Small delay to ensure DOM nodes and FocusItem registration are complete
      const timer = setTimeout(() => {
        if (!userInteractedRef.current) {
          const targetId = actions.length > 0 ? 'action-0' : 'action-sources';
          setFocusedId(targetId);
        }
        setHasAutofocused(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [actions, hasAutofocused, setFocusedId]);

  useEffect(() => {
    if (!eventBus || !manager || !viewModel) return;
    console.log(`[NAV_LOG] [UniversalMediaDetailView] Component mounted for mediaId='${mediaId}'. Registering and setting active group 'media-details-modal'.`);
    registerGroup('media-details-modal', true);
    setActiveGroup('media-details-modal');

    const onReady = (e: any) => {
      if (e.mediaId === mediaId) {
        console.log(`====================================`);
        console.log(`DETAILS READY`);
        console.log(`====================================`);
        console.log(`Media:`);
        console.log(`- id: ${e.data?.data?.id || mediaId}`);
        console.log(`- title: ${e.data?.data?.title || 'Unknown'}`);

        setDetails(e.data);
        setSections(viewModel.getSections(mediaId));
        setActions(viewModel.getActions(mediaId));
        setArtwork(viewModel.getHeaderArtwork(mediaId));
      }
    };

    const onFailed = (e: any) => {
      if (e.mediaId === mediaId) {
        console.log(`[NAV_LOG] [UniversalMediaDetailView] DETAILS_FAILED received for mediaId='${mediaId}':`, e.error);
        setError(e.error?.message || 'Failed to load details. Provider may be unconfigured or offline.');
      }
    };

    const onUpdated = (e: any) => {
      if (e.mediaId === mediaId) {
        setDetails(e.data);
        setSections(viewModel.getSections(mediaId));
      }
    };

    eventBus.on(MediaDetailsEventType.DETAILS_READY, onReady);
    eventBus.on(MediaDetailsEventType.DETAILS_UPDATED, onUpdated);
    eventBus.on(MediaDetailsEventType.DETAILS_FAILED, onFailed);

    manager.loadDetails(mediaType, mediaId);

    return () => {
      eventBus.off(MediaDetailsEventType.DETAILS_READY, onReady);
      eventBus.off(MediaDetailsEventType.DETAILS_UPDATED, onUpdated);
      eventBus.off(MediaDetailsEventType.DETAILS_FAILED, onFailed);
    };
  }, [mediaId, mediaType, registerGroup, setFocusedId]);

  // Handle returning focus/scroll to top when closed? The SpatialFocusContainer handles back key
  // But we might need to intercept it to ensure we close properly. The parent component passes onClose.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack') {
        onClose();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

    // Compute streamQuery before early returns to preserve hook ordering
  const streamQuery: MediaSearchQuery | null = React.useMemo(() => {
    if (!details?.data) return null;
    if (details.type === 'movie') {
      const year = details.data.releaseDate ? parseInt(details.data.releaseDate.substring(0, 4)) : undefined;
      return {
        mediaId: details.data.id,
        type: 'movie',
        title: details.data.title,
        year,
        imdbId: details.data.externalIds?.imdbId,
        tmdbId: details.data.externalIds?.tmdbId || details.data.id
      };
    }
    if (details.type === 'series' && selectedEpisode) {
      const year = details.data.firstAirDate ? parseInt(details.data.firstAirDate.substring(0, 4)) : undefined;
      return {
        mediaId: selectedEpisode.id || `${details.data.id}_${selectedEpisode.seasonNumber}_${selectedEpisode.episodeNumber}`,
        type: 'episode',
        title: details.data.title,
        year,
        season: selectedEpisode.seasonNumber,
        episode: selectedEpisode.episodeNumber,
        imdbId: details.data.externalIds?.imdbId,
        tmdbId: details.data.externalIds?.tmdbId || details.data.id
      };
    }
    return null;
  }, [details, selectedEpisode]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-[#050506]/95 flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="text-tv-error font-bold text-xl flex items-center gap-2">
           <X className="w-8 h-8" /> Metadata Load Failed
        </div>
        <p className="text-tv-text-secondary text-sm max-w-md text-center">{error}</p>
        <div className="flex gap-4 mt-4">
           <TVButton id="btn-retry" groupId="media-details-modal" onClick={() => manager?.loadDetails(mediaType, mediaId)} variant="secondary">Retry</TVButton>
           <TVButton id="btn-close" groupId="media-details-modal" onClick={onClose} variant="primary">Close</TVButton>
        </div>
      </div>
    );
  }

  if (!details) {
    if (initialMedia) {
      return (
        <div className="fixed inset-0 z-50 bg-tv-bg text-white overflow-hidden tv-scrollbar" ref={containerRef}>
          <TVHero
            key="tv-hero-main"
            title={initialMedia.title}
            imageUrl={initialMedia.backdropUrl || initialMedia.posterUrl}
            description={initialMedia.overview}
          />
          <div className="absolute inset-0 z-50 flex items-center justify-center">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-50 bg-[#050506]/95 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }



  const media = details.data;
  const overviewSection = sections.find(s => s.type === 'overview');
  const episodesSection = sections.find(s => s.type === 'episodes');
  const castSection = sections.find(s => s.type === 'cast');

  

  const handleActionClick = (action: MediaAction) => {
    if (action.type === MediaActionType.PLAY || action.type === MediaActionType.RESUME || action.id === 'sources') {
       // Focus the first stream so user can select one
       setFocusedId('stream-0');
    }
  };

  // Build Hero Subtitle
  const releaseYear = viewModel.formatReleaseYear(overviewSection?.data?.releaseDate);
  const runtime = viewModel.formatRuntime(overviewSection?.data?.duration);
  const certification = overviewSection?.data?.certifications?.[0]?.rating;
  const imdbRating = media.externalIds?.imdbId ? "IMDb" : null; 
  // Normally would show exact rating but we don't have it easily. Let's just put genres and basic info.
  
  const subtitleParts = [];
  if (releaseYear) subtitleParts.push(releaseYear);
  if (runtime) subtitleParts.push(runtime);
  if (certification) subtitleParts.push(certification);
  if (overviewSection?.data?.genres) {
    subtitleParts.push(overviewSection.data.genres.map((g: any) => g.name).join(' • '));
  }

  const relatedShelves = RelatedShelfEngine.buildShelves(homeViewModel.getCatalog(), { targetMedia: media, language: 'All' });

  // Map actions to TVButtons
  const heroActions = actions.map((action, i) => {
    let icon = undefined;
    if (action.type === MediaActionType.PLAY) icon = <Play className="w-6 h-6 fill-current" />;
    if (action.type === MediaActionType.RESUME) icon = <RotateCcw className="w-6 h-6" />;
    if (action.type === MediaActionType.WATCH_TRAILER) icon = <Film className="w-6 h-6" />;
    if (action.type === MediaActionType.ADD_TO_WATCHLIST) icon = <Plus className="w-6 h-6" />;
    if (action.type === MediaActionType.MARK_WATCHED) icon = <Check className="w-6 h-6" />;
    
    // Check if it's "More Sources" (which might not exist in current action resolver)
    
    return (
      <TVButton
        key={action.id}
        id={`action-${i}`}
        groupId="media-details-modal"
        variant={action.isPrimary ? 'primary' : 'secondary'}
        onClick={() => handleActionClick(action)}
        icon={icon}
      >
        {action.label}
      </TVButton>
    );
  });
  
  // Add More Sources button if not present
  if (!actions.find(a => a.id === 'sources')) {
    heroActions.push(
      <TVButton
        key="sources"
        id="action-sources"
        groupId="media-details-modal"
        variant="secondary"
        onClick={() => setPendingStreamFocus(true)}
      >
        More Sources
      </TVButton>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-tv-bg overflow-y-auto overflow-x-hidden font-sans custom-scrollbar" ref={containerRef}>
      
      {/* Top Navigation / Close Button */}
      <div className="absolute top-8 right-8 z-50">
        <FocusItem
          id="btn-close-details"
          groupId="media-details-modal"
          onClick={onClose}
          className="p-3 rounded-full bg-tv-surface-light text-tv-text-secondary border border-tv-surface-light hover:text-white transition-colors"
          focusedClassName="ring-[3px] ring-white bg-tv-surface-lighter text-white"
        >
          <X className="w-6 h-6" />
        </FocusItem>
      </div>

      <TVHero
        key="tv-hero-main"
        title={media.title}
        subtitle={subtitleParts.join(' • ')}
        description={overviewSection?.data?.overview}
        imageUrl={artwork.backdrop?.url || artwork.poster?.url || ''}
        logoUrl={artwork.logo?.url}
        actions={heroActions}
        className="mb-8"
      />

      <div className="px-tv-safe-h pb-tv-safe-v space-y-12 relative z-10 -mt-16">
        
        <div className="flex flex-row gap-12 w-full">
          {/* Stream Section (Left) */}
          <div className="flex-1 w-[60%]">
             <h3 className="text-tv-heading font-bold text-white mb-6 uppercase tracking-wider text-sm opacity-70">Available Streams</h3>
             {streamQuery ? (
               <StreamSection query={streamQuery} onStreamSelected={(stream) => {
                 let playMedia = media;
                 if (details.type === 'series' && selectedEpisode) {
                    playMedia = {
                      ...media,
                      id: selectedEpisode.id || `${details.data.id}_${selectedEpisode.seasonNumber}_${selectedEpisode.episodeNumber}`,
                      mediaType: 'episode',
                      title: `${details.data.title} - S${String(selectedEpisode.seasonNumber).padStart(2, '0')}E${String(selectedEpisode.episodeNumber).padStart(2, '0')} - ${selectedEpisode.title || 'Episode'}`,
                      overview: selectedEpisode.overview || details.data.overview
                    };
                 }
                 if (onPlay) onPlay(playMedia, stream, 0);
               }} groupId="media-details-modal" pendingFocus={pendingStreamFocus} onFocusComplete={() => setPendingStreamFocus(false)} />
             ) : (
               <div className="flex flex-col items-center justify-center h-64 w-full opacity-50">
                 {(!episodesSection || !episodesSection.data || !episodesSection.data.episodes) ? (
                   <>
                     <h4 className="text-lg font-bold text-white mb-2">No Episodes Available</h4>
                     <p className="text-tv-text-secondary text-sm">This season has no episodes listed.</p>
                   </>
                 ) : (
                   <>
                     <h4 className="text-lg font-bold text-white mb-2">Select an Episode</h4>
                     <p className="text-tv-text-secondary text-sm">Choose an episode to view available streams.</p>
                   </>
                 )}
               </div>
             )}
          </div>

          {/* Information Section (Right) */}
          <div className="w-[40%] flex-shrink-0">
            <h3 className="text-tv-heading font-bold text-white mb-6 uppercase tracking-wider text-sm opacity-70">Details</h3>
            <div className="bg-tv-surface-light/50 p-8 rounded-tv-card border border-white/5 space-y-6">
               {castSection && (
                 <div>
                    <h4 className="text-tv-heading font-bold text-white mb-3 uppercase tracking-wider text-xs opacity-70">Cast</h4>
                    <div className="flex flex-wrap gap-4 pb-2">
                      {(castSection.data as any[]).slice(0, 4).map((person: any, idx: number) => (
                        <FocusItem 
                          key={person.id} 
                          id={`cast-${idx}`}
                          groupId="media-details-modal"
                          className="min-w-[80px] text-center p-2 rounded-xl transition-colors"
                          focusedClassName="bg-white/10 ring-[2px] ring-white scale-[1.05] z-10"
                        >
                          <div className="w-16 h-16 mx-auto rounded-full bg-tv-surface-lighter overflow-hidden mb-2 shadow-lg">
                            {person.profileImage && (
                              <LazyImage src={person.profileImage} alt={person.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-white leading-tight">{person.name}</h5>
                        </FocusItem>
                      ))}
                    </div>
                 </div>
               )}
               
               <FocusItem
                 id="metadata-section"
                 groupId="media-details-modal"
                 className="p-4 -mx-4 rounded-xl transition-colors"
                 focusedClassName="bg-white/5 ring-[2px] ring-white"
               >
                 <div className="grid grid-cols-2 gap-6">
                   {overviewSection?.data?.releaseDate && (
                     <div>
                       <h4 className="text-tv-text-secondary text-xs font-bold mb-1 uppercase tracking-wider">Release Date</h4>
                       <p className="text-white text-sm font-medium">{new Date(overviewSection.data.releaseDate).toLocaleDateString()}</p>
                     </div>
                   )}
                   {overviewSection?.data?.status && (
                     <div>
                       <h4 className="text-tv-text-secondary text-xs font-bold mb-1 uppercase tracking-wider">Status</h4>
                       <p className="text-white text-sm font-medium">{overviewSection.data.status}</p>
                     </div>
                   )}
                   {overviewSection?.data?.duration && (
                     <div>
                       <h4 className="text-tv-text-secondary text-xs font-bold mb-1 uppercase tracking-wider">Runtime</h4>
                       <p className="text-white text-sm font-medium">{viewModel.formatRuntime(overviewSection.data.duration)}</p>
                     </div>
                   )}
                   {media.externalIds?.tmdbId && (
                     <div>
                       <h4 className="text-tv-text-secondary text-xs font-bold mb-1 uppercase tracking-wider">TMDB ID</h4>
                       <p className="text-white text-sm font-medium">{media.externalIds.tmdbId}</p>
                     </div>
                   )}
                 </div>
               </FocusItem>
            </div>
          </div>
        </div>

        {/* Episodes Row */}
        {episodesSection && episodesSection.data && episodesSection.data.episodes && (
          <div className="mb-12">
            <TVRow title="Episodes">
              {(episodesSection.data.episodes as any[]).map((ep: any, idx: number) => (
                <div key={ep.id || idx} className="flex-shrink-0 w-[240px]">
                  <TVPoster
                    id={`episode-${ep.id || idx}`}
                    className={selectedEpisode?.id === ep.id ? 'ring-2 ring-tv-primary' : ''}
                    groupId="media-details-modal"
                    imageUrl={ep.stillUrl || artwork.backdrop?.url || artwork.poster?.url || ''}
                    title={`E${ep.episodeNumber || idx + 1}: ${ep.title || 'Episode'}`}
                    subtitle={ep.overview || ''}
                    onClick={() => {
                       setSelectedEpisode(ep);
                       setPendingStreamFocus(true);
                    }}
                    aspectRatio="backdrop"
                  />
                </div>
              ))}
            </TVRow>
          </div>
        )}

        {/* Related Content Shelves */}
        <div className="space-y-tv-row-gap">
          {relatedShelves.map((shelf) => (
            <TVRow key={shelf.id} title={shelf.title}>
              {shelf.items.map((m, idx) => (
                <div key={m.id} className="flex-shrink-0 w-[180px] md:w-[220px]">
                  <TVPoster
                    id={`related-${shelf.id}-${m.id}`}
                    groupId="media-details-modal"
                    imageUrl={m.posterUrl}
                    title={m.title}
                    subtitle={m.genres.slice(0, 2).join(' • ')}
                    onClick={() => {
                      if (onSelectRelated) onSelectRelated(m);
                    }}
                    aspectRatio="poster"
                  />
                </div>
              ))}
            </TVRow>
          ))}
        </div>

      </div>
    </div>
  );
};

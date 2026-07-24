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

interface Props {
  mediaId: string;
  mediaType: 'movie' | 'series' | 'anime';
  onClose: () => void;
  onPlay?: (media: MediaItem, stream: StreamSource, startPosition?: number) => void;
  onSelectRelated?: (media: MediaItem) => void;
}

export const UniversalMediaDetailView: React.FC<Props> = ({ mediaId, mediaType, onClose, onPlay, onSelectRelated }) => {
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

  useEffect(() => {
    if (!eventBus || !manager || !viewModel) return;
    registerGroup('media-details-modal', true);
    setActiveGroup('media-details-modal');

    const onReady = (e: any) => {
      if (e.mediaId === mediaId) {
        setDetails(e.data);
        setSections(viewModel.getSections(mediaId));
        setActions(viewModel.getActions(mediaId));
        setArtwork(viewModel.getHeaderArtwork(mediaId));
        setTimeout(() => setFocusedId('action-0'), 50);
      }
    };

    const onFailed = (e: any) => {
      if (e.mediaId === mediaId) {
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
        onClick={() => setFocusedId('stream-0')}
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
             <StreamSection media={media} onStreamSelected={(stream) => onPlay && onPlay(media, stream, 0)} groupId="media-details-modal" />
          </div>

          {/* Information Section (Right) */}
          <div className="w-[40%] flex-shrink-0">
            <h3 className="text-tv-heading font-bold text-white mb-6 uppercase tracking-wider text-sm opacity-70">Details</h3>
            <div className="bg-tv-surface-light/50 p-8 rounded-tv-card border border-white/5 space-y-6">
               {castSection && (
                 <div>
                    <h4 className="text-tv-heading font-bold text-white mb-3 uppercase tracking-wider text-xs opacity-70">Cast</h4>
                    <div className="flex flex-wrap gap-4 pb-2">
                      {(castSection.data as any[]).slice(0, 4).map((person: any) => (
                        <div key={person.id} className="min-w-[80px] text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-tv-surface-lighter overflow-hidden mb-2 shadow-lg">
                            {person.profileImage && (
                              <LazyImage src={person.profileImage} alt={person.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-white leading-tight">{person.name}</h5>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
               
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
            </div>
          </div>
        </div>

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

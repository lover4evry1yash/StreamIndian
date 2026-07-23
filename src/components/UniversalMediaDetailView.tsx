import React, { useEffect, useState } from 'react';
import { Play, RotateCcw, Plus, Check, Bookmark, X, Star, Clock, MonitorPlay, Film } from 'lucide-react';
import { useSpatialFocus } from './SpatialFocusContainer';
import { FocusItem } from './FocusItem';
import { LazyImage } from './LazyImage';
import { useEventBus, useMediaDetailsManager, useMediaDetailsViewModel } from '../context/ServiceContext';
import { MediaDetailsEventType, MediaDetailsManager, MediaDetailsViewModel, MediaDetails, MediaSection, MediaAction, MediaActionType } from '../core/details';
import { EventBus } from '../core/EventBus';

interface Props {
  mediaId: string;
  mediaType: 'movie' | 'series' | 'anime';
  onClose: () => void;
  onPlay?: (media: any, startPosition?: number) => void;
}

export const UniversalMediaDetailView: React.FC<Props> = ({ mediaId, mediaType, onClose, onPlay }) => {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<MediaSection[]>([]);
  const [actions, setActions] = useState<MediaAction[]>([]);
  const [artwork, setArtwork] = useState<{ poster?: any, backdrop?: any, logo?: any }>({});
  
  const { registerGroup, setFocusedId } = useSpatialFocus();
  const eventBus = useEventBus();
  const manager = useMediaDetailsManager();
  const viewModel = useMediaDetailsViewModel();

  useEffect(() => {

    if (!eventBus || !manager || !viewModel) return;

    registerGroup('media-details-modal', true);

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

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-[#050506]/95 flex flex-col items-center justify-center space-y-4">
        <div className="text-red-500 font-bold text-xl flex items-center gap-2">
           <X className="w-8 h-8" /> Metadata Load Failed
        </div>
        <p className="text-zinc-400 text-sm max-w-md text-center">{error}</p>
        <div className="flex gap-4 mt-4">
           <FocusItem id="btn-retry" onClick={() => manager?.loadDetails(mediaType, mediaId)} className="px-6 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all font-bold">Retry</FocusItem>
           <FocusItem id="btn-close" onClick={onClose} className="px-6 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all font-bold">Close</FocusItem>
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

  const handleActionClick = (action: MediaAction) => {
    if (action.type === MediaActionType.PLAY && onPlay) {
      onPlay(media, 0);
    } else if (action.type === MediaActionType.RESUME && onPlay) {
      onPlay(media, 100); // Placeholder resume
    }
  };

  const overviewSection = sections.find(s => s.type === 'overview');
  const episodesSection = sections.find(s => s.type === 'episodes');
  const otherSections = sections.filter(s => s.type !== 'overview' && s.type !== 'episodes');

  return (
    <div className="fixed inset-0 z-50 bg-[#050506] overflow-hidden flex flex-col font-sans">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30" 
          style={{ backgroundImage: `url(${artwork.backdrop?.url || artwork.poster?.url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050506] via-[#050506]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050506] via-[#050506]/80 to-transparent" />
      </div>

      <div className="absolute top-8 right-8 z-20">
        <FocusItem
          id="btn-close-details"
          groupId="media-details-modal"
          onClick={onClose}
          className="p-3 rounded-full bg-white/10 text-zinc-300 border border-white/20 hover:text-white"
        >
          <X className="w-6 h-6" />
        </FocusItem>
      </div>

      <div className="relative z-10 flex-1 flex flex-col md:flex-row p-12 md:p-16 lg:p-24 overflow-y-auto">
        {/* Left Column - Details */}
        <div className="w-full md:w-2/3 flex flex-col gap-8 pr-12">
          
          {/* Logo or Title */}
          {artwork.logo ? (
            <LazyImage src={artwork.logo.url} alt={media.title} className="max-h-32 object-contain" priority="high" />
          ) : (
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
              {media.title}
            </h1>
          )}
          
          {(media).originalTitle && (
            <h2 className="text-xl text-zinc-400 font-semibold italic">{(media).originalTitle}</h2>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-zinc-300">
            {overviewSection?.data?.releaseDate && (
              <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                {viewModel?.formatReleaseYear(overviewSection.data.releaseDate)}
              </span>
            )}
            
            {overviewSection?.data?.certifications?.[0] && (
              <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                {overviewSection.data.certifications[0].rating}
              </span>
            )}
            
            {overviewSection?.data?.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-indigo-400" />
                {viewModel?.formatRuntime(overviewSection.data.duration)}
              </span>
            )}
            
            {overviewSection?.data?.genres?.map((g: any) => (
              <span key={g.id} className="text-indigo-300">{g.name}</span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-lg text-zinc-300 leading-relaxed line-clamp-4 max-w-3xl">
            {overviewSection?.data?.overview}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4">
            {actions.map((action, i) => (
              <FocusItem
                key={action.id}
                id={`action-${i}`}
                groupId="media-details-modal"
                onClick={() => handleActionClick(action)}
                className={`px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all ${
                  action.isPrimary 
                    ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] border-2 border-indigo-400 focus:scale-105' 
                    : 'bg-white/10 text-zinc-200 border-2 border-transparent focus:border-white/50 focus:bg-white/20'
                }`}
              >
                {action.type === MediaActionType.PLAY && <Play className="w-5 h-5 fill-current" />}
                {action.type === MediaActionType.RESUME && <RotateCcw className="w-5 h-5" />}
                {action.type === MediaActionType.WATCH_TRAILER && <Film className="w-5 h-5" />}
                {action.type === MediaActionType.ADD_TO_WATCHLIST && <Plus className="w-5 h-5" />}
                {action.type === MediaActionType.MARK_WATCHED && <Check className="w-5 h-5" />}
                <span>{action.label}</span>
              </FocusItem>
            ))}
          </div>

          {/* Additional Sections */}
          <div className="mt-8 flex flex-col gap-10">
            {episodesSection && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Episodes</h3>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {episodesSection.data.episodes.slice(0, 10).map((ep: any, i: number) => (
                    <FocusItem
                      key={ep.id}
                      id={`ep-${ep.id}`}
                      groupId="media-details-modal"
                      className="min-w-[280px] bg-white/5 border border-white/10 rounded-xl overflow-hidden focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/30 transition-all"
                    >
                      <div className="aspect-video bg-zinc-900 relative">
                        {ep.artwork?.posters?.[0]?.url && (
                          <LazyImage src={ep.artwork.posters[0].url} alt={ep.title} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-xs font-bold text-white">
                          S{ep.seasonNumber} E{ep.episodeNumber}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-sm font-bold text-white line-clamp-1">{ep.title}</h4>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{ep.overview}</p>
                      </div>
                    </FocusItem>
                  ))}
                </div>
              </div>
            )}
            
            {otherSections.map(section => (
              <div key={section.id}>
                <h3 className="text-xl font-bold text-zinc-200 mb-3">{section.title}</h3>
                {section.type === 'cast' && (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    {(section.data as any[]).slice(0, 8).map((person: any, i: number) => (
                      <FocusItem
                        key={person.id}
                        id={`person-${person.id}`}
                        groupId="media-details-modal"
                        className="min-w-[120px] text-center rounded-xl p-2 focus:bg-white/10 transition-colors"
                      >
                        <div className="w-24 h-24 mx-auto rounded-full bg-zinc-800 overflow-hidden mb-2 border border-white/10">
                          {person.profileImage && (
                            <LazyImage src={person.profileImage} alt={person.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-white leading-tight">{person.name}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{person.character}</p>
                      </FocusItem>
                    ))}
                  </div>
                )}
                {/* Add more custom section renderers if needed */}
              </div>
            ))}
          </div>

        </div>

        {/* Right Column - Poster & Extra Info */}
        <div className="hidden md:flex md:w-1/3 flex-col items-end pt-12">
          {artwork.poster && (
            <div className="w-2/3 rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
              <LazyImage src={artwork.poster.url} alt={media.title} className="w-full h-auto object-cover" priority="high" />
            </div>
          )}
          
          <div className="w-2/3 mt-6 bg-white/5 rounded-xl border border-white/10 p-5 text-sm">
            <h4 className="font-bold text-white mb-2 uppercase tracking-wider text-xs">Facts</h4>
            {overviewSection?.data?.status && (
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400">Status</span>
                <span className="text-white font-medium">{overviewSection.data.status}</span>
              </div>
            )}
            {media.externalIds && (
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-zinc-400">TMDB ID</span>
                <span className="text-white font-medium">{media.externalIds.tmdbId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

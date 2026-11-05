import { MetadataEventType, MetadataEventPayload } from './metadata/events';
import { MediaDetailsEventType } from './details/events';
import { AppLifecycleEvent } from './AppLifecycle';
import { SearchEventType, SearchQuery, SearchResult, SearchError } from './search/types';
import { Route } from './navigation/Router';
import { PlaybackStateEvent, PlaybackProgressEvent, PlaybackBufferEvent, PlaybackErrorEvent, PlaybackTrackChangeEvent } from './playback/types';
import { AppSettings } from './storage/SettingsManager';
import { MediaDetails } from './details/types';

export type EventHandler<T = unknown> = (data: T) => void;
export type EventErrorHandler = (error: unknown, event: keyof EventMap) => void;

export type EventMap = {
  'ROUTE_CHANGED': Route;
  'MODAL_OPENED': { modalId: string; data?: any };
  'MODAL_CLOSED': { modalId: string };
  'FOCUS_CHANGED': string | null;
  
  'PLAYBACK_STATE_CHANGED': PlaybackStateEvent;
  'PLAYBACK_PROGRESS': PlaybackProgressEvent;
  'PLAYBACK_BUFFER': PlaybackBufferEvent;
  'PLAYBACK_COMPLETED': void;
  'PLAYBACK_ERROR': PlaybackErrorEvent;
  'PLAYBACK_SEEK_COMPLETED': void;
  'PLAYBACK_TRACK_CHANGED': PlaybackTrackChangeEvent;
  
  [SearchEventType.SEARCH_STARTED]: { query: SearchQuery };
  [SearchEventType.SEARCH_UPDATED]: { query: SearchQuery; results: SearchResult };
  [SearchEventType.SEARCH_COMPLETED]: { query: SearchQuery; results: SearchResult };
  [SearchEventType.SEARCH_FAILED]: { query: SearchQuery; error: SearchError };
  [SearchEventType.SEARCH_CANCELLED]: { query: SearchQuery };

  'SETTINGS_LOADED': AppSettings;
  'SETTINGS_UPDATED': AppSettings;

  [MetadataEventType.LOADED]: MetadataEventPayload;
  [MetadataEventType.UPDATED]: MetadataEventPayload;
  [MetadataEventType.INVALIDATED]: MetadataEventPayload;
  [MetadataEventType.PREFETCHED]: MetadataEventPayload;
  [MetadataEventType.ERROR]: MetadataEventPayload;

  [MediaDetailsEventType.DETAILS_LOADING]: { mediaId: string, mediaType: 'movie' | 'series' | 'anime' };
  [MediaDetailsEventType.DETAILS_READY]: { mediaId: string, mediaType: 'movie' | 'series' | 'anime', data: MediaDetails };
  [MediaDetailsEventType.DETAILS_UPDATED]: { mediaId: string, mediaType: 'movie' | 'series' | 'anime', data: MediaDetails };
  [MediaDetailsEventType.DETAILS_FAILED]: { mediaId: string, mediaType: 'movie' | 'series' | 'anime', error: any };
  [MediaDetailsEventType.ARTWORK_READY]: { mediaId: string, mediaType: 'movie' | 'series' | 'anime' };
  [MediaDetailsEventType.SEASON_CHANGED]: { seriesId: string, seasonNumber: number };
  [MediaDetailsEventType.EPISODE_SELECTED]: { seriesId: string, seasonNumber: number, episodeNumber: number };

  [AppLifecycleEvent.FOREGROUND]: void;
  [AppLifecycleEvent.BACKGROUND]: void;
  [AppLifecycleEvent.EXIT]: void;

  'TRANSFER_COMPLETED': { infoHash: string, providerId: string, status?: import('./streams/debrid/types').TransferStatus };
  'TRANSFER_STARTED': { infoHash: string, providerId: string, transferId: string, title?: string };
  'TRANSFER_ERROR': { infoHash: string, providerId: string, status?: import('./streams/debrid/types').TransferStatus, message?: string };
  'TRANSFER_PROGRESS': { infoHash: string, providerId: string, status?: import('./streams/debrid/types').TransferStatus };
  'stream:state_changed': any;
};

export class EventBus {
  private listeners: Map<keyof EventMap, Set<EventHandler>> = new Map();

  constructor(private readonly onHandlerError: EventErrorHandler = (error, event) => {
    console.error(`[EventBus] Handler failed for ${String(event)}`, error);
  }) {}

  public on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);
    return () => this.off(event, handler);
  }

  public off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) this.listeners.delete(event);
    }
  }

  public once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    let unsubscribe = () => {};
    const onceWrapper = (data: EventMap[K]) => {
      unsubscribe();
      handler(data);
    };
    unsubscribe = this.on(event, onceWrapper);
    return unsubscribe;
  }

  public emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      [...handlers].forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          this.onHandlerError(error, event);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

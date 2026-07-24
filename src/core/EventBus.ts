import { MetadataEventType, MetadataEventPayload } from './metadata/events';
import { MediaDetailsEventType } from './details/events';
import { AppLifecycleEvent } from './AppLifecycle';
import { SearchEventType, SearchQuery, SearchResult, SearchError } from './search/types';
import { Route } from './navigation/Router';
import { PlaybackStateEvent, PlaybackProgressEvent, PlaybackBufferEvent, PlaybackErrorEvent, PlaybackTrackChangeEvent } from './playback/types';
import { AppSettings } from './storage/SettingsManager';
import { MediaDetails } from './details/types';

export type EventHandler<T = any> = (data: T) => void;

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
  private listeners: Map<keyof EventMap, EventHandler[]> = new Map();

  public on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler as EventHandler);
  }

  public off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      this.listeners.set(
        event,
        handlers.filter((h) => h !== handler)
      );
    }
  }

  public once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const onceWrapper = (data: EventMap[K]) => {
      this.off(event, onceWrapper);
      handler(data);
    };
    this.on(event, onceWrapper);
  }

  public emit<K extends keyof EventMap>(event: K, data?: EventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[EventBus] Error in handler for event ${String(event)}:`, error);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

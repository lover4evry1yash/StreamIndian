import { EventBus } from '../../EventBus';
import { StreamDiscoveryService } from '../services/StreamDiscoveryService';
import { StreamResolutionService } from '../services/StreamResolutionService';
import { StreamSortingService } from '../services/StreamSortingService';
import { SettingsManager } from '../../storage/SettingsManager';
import { MediaItem, StreamSource, PlaybackReadiness } from '../../../types/tizen';
import { CanonicalStreamSource, StreamSortOptions, MediaSearchQuery } from '../types';

export type StreamState = 
  | 'idle' 
  | 'searching_providers' 
  | 'collecting_sources' 
  | 'resolving_streams' 
  | 'sorting' 
  | 'checking_cache' 
  | 'preparing_playback' 
  | 'ready' 
  | 'error';

export class StreamViewModel {
  private eventBus: EventBus;
  private discoveryService: StreamDiscoveryService;
  private resolutionService: StreamResolutionService;
  private sortingService: StreamSortingService;
  private settingsManager: SettingsManager;
  
  private _state: StreamState = 'idle';
  private _streams: StreamSource[] = [];
  private _discoveredSources: CanonicalStreamSource[] = [];
  private _error: string | null = null;
  private _debridMessage: string | null = null;
  
  private currentQuery: MediaSearchQuery | null = null;
  private cachedOptionsHash: string | null = null;

  constructor(
    eventBus: EventBus,
    discoveryService: StreamDiscoveryService,
    resolutionService: StreamResolutionService,
    sortingService: StreamSortingService,
    settingsManager: SettingsManager
  ) {
    this.eventBus = eventBus;
    this.discoveryService = discoveryService;
    this.resolutionService = resolutionService;
    this.sortingService = sortingService;
    this.settingsManager = settingsManager;
  }

  get state() { return this._state; }
  get streams() { return this._streams; }
  get discoveredSources() { return this._discoveredSources; }
  get error() { return this._error; }
  get debridMessage() { return this._debridMessage; }

  private notify() {
    this.eventBus.emit('stream:state_changed', {
      state: this._state,
      streams: this._streams,
      error: this._error,
      debridMessage: this._debridMessage,
      discoveredSources: this._discoveredSources
    });
  }
  
  private setState(state: StreamState) {
    this._state = state;
    this.notify();
  }

  public async fetchStreams(query: MediaSearchQuery, forceRefresh: boolean = false) {
    const settings = this.settingsManager.getSettings();
    const sortMode = settings.streams?.sortMode || 'best';
    const hideUncached = settings.streams?.hideUncached || false;
    const preferredLanguage = settings.playback?.defaultAudioLanguage || undefined;
    
    const queryId = `${query.mediaId}_${query.season || 0}_${query.episode || 0}`;
    const optionsHash = `${queryId}_${sortMode}_${hideUncached}_${preferredLanguage}`;
    
    if (!forceRefresh && this.currentQuery && `${this.currentQuery.mediaId}_${this.currentQuery.season || 0}_${this.currentQuery.episode || 0}` === queryId && this.cachedOptionsHash === optionsHash) {
       // Just reuse from memory
       if (this._state !== 'error' && this._state !== 'idle') {
           this.setState('ready');
           return;
       }
    }
    
    this.currentQuery = query;
    this.cachedOptionsHash = optionsHash;
    this._error = null;
    this._streams = [];
    this._discoveredSources = [];
    
    try {
      this.setState('searching_providers');
      // In a real implementation this could be split from collecting_sources, 
      // but discoveryService groups them for now.
      
      this.setState('collecting_sources');
      this._discoveredSources = await this.discoveryService.discover(query);
      console.log(`TRACE_COUNT: Discovery: ${this._discoveredSources.length}`);
      
      this.setState('resolving_streams');
      const sortOptions: StreamSortOptions = { mode: sortMode, preferredLanguage };
      let resolved = await this.resolutionService.resolve(this._discoveredSources, sortOptions);
      console.log(`TRACE_COUNT: Resolution: ${resolved.length}`);
      
      this.setState('sorting');
      resolved = this.sortingService.sort(resolved, sortOptions);
      
      this.setState('checking_cache');
      if (hideUncached) {
         resolved = resolved.filter(s => s.readiness !== PlaybackReadiness.DEBRID_REQUIRED && s.readiness !== PlaybackReadiness.DIRECT_TORRENT);
      }
      
      this._streams = resolved;
      console.log(`TRACE_COUNT: ViewModel: ${this._streams.length}`);
      
      this.setState('ready');
    } catch (err) {
      console.error("Stream fetch error:", err);
      this._error = 'Failed to discover streams.';
      this.setState('error');
    }
  }

  public async selectStream(stream: StreamSource): Promise<StreamSource | null> {
    this.setState('preparing_playback');
    
    try {
      const resolvedStream = await this.resolutionService.prepareStream(
        stream, 
        (progress, message) => {
          this._debridMessage = message;
          this.notify();
        }
      );
      
      if (!resolvedStream) {
        this._error = 'Failed to resolve playable direct HTTP stream.';
        this.setState('error');
        return null;
      }
      
      this._debridMessage = null;
      this.setState('ready');
      return resolvedStream;
      
    } catch (err) {
      this._error = 'Playback preparation failed.';
      this.setState('error');
      return null;
    }
  }
}

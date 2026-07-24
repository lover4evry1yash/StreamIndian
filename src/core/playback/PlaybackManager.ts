import { EventBus } from '../EventBus';
import { Logger } from '../Logger';
import { PlaybackHistoryService } from './services/PlaybackHistoryService';
import {
  PlaybackState,
  PlaybackError,
  PlaybackErrorCategory,
  AudioTrack,
  SubtitleTrack
} from './types';
import { PlaybackSession } from './PlaybackSession';
import { AVPlayManager, AVPlayEventCallback } from '../avplay';
import { AVPlayPlayerState, AVPlayPlaybackInfo, StreamSource, MediaItem } from '../../types/tizen';
import { CacheManager } from '../storage';

export interface PlaybackConfig {
  maxRetries: number;
  retryDelayMs: number;
}

export class PlaybackManager {
  private eventBus: EventBus;
  private logger: Logger;
  public historyService: PlaybackHistoryService;
  private avplayManager: AVPlayManager;
  
  private currentState: PlaybackState = PlaybackState.IDLE;
  private session: PlaybackSession | null = null;
  
  private retryCount: number = 0;
  private config: PlaybackConfig = {
    maxRetries: 3,
    retryDelayMs: 2000,
  };

  private avplayListenerCleanup: (() => void) | null = null;
  private lastStreamSource: StreamSource | null = null;
  private lastMedia: MediaItem | null = null;

  constructor(eventBus: EventBus, logger: Logger, cacheManager: CacheManager, avplayManager: AVPlayManager) {
    this.eventBus = eventBus;
    this.logger = logger;
    this.historyService = new PlaybackHistoryService(cacheManager);
    this.avplayManager = avplayManager;
    this.setupAVPlayListeners();
  }

  public registerVideoContainer(element: HTMLVideoElement) {
    this.avplayManager.registerVideoContainer(element);
  }

  private setupAVPlayListeners() {
    this.avplayListenerCleanup = this.avplayManager.addListener((info: AVPlayPlaybackInfo) => {
      this.handleAVPlayState(info);
    });
  }

  private handleAVPlayState(info: AVPlayPlaybackInfo) {
    let newState = this.currentState;

    switch (info.state) {
      case AVPlayPlayerState.IDLE:
      case AVPlayPlayerState.NONE:
        newState = PlaybackState.IDLE;
        break;
      case AVPlayPlayerState.INITIALIZED:
      case AVPlayPlayerState.PREPARED:
        newState = PlaybackState.LOADING;
        break;
      case AVPlayPlayerState.PLAYING:
        newState = info.bufferingPercentage < 100 && info.bufferingPercentage > 0 ? PlaybackState.BUFFERING : PlaybackState.PLAYING;
        if (this.retryCount > 0) this.retryCount = 0; // Reset retries on successful play
        break;
      case AVPlayPlayerState.PAUSED:
        newState = PlaybackState.PAUSED;
        break;
      case AVPlayPlayerState.STOPPED:
        if (info.currentTime >= info.duration && info.duration > 0) {
            newState = PlaybackState.COMPLETED;
        } else {
            newState = PlaybackState.STOPPED;
        }
        break;
      case AVPlayPlayerState.ERROR:
        this.handlePlaybackError({
          category: PlaybackErrorCategory.AVPLAY,
          message: 'AVPlay reported an error state'
        });
        return; // Error handled separately
    }

    // Handle buffering events even in playing state if buffering is not 100
    if (newState === PlaybackState.PLAYING && info.bufferingPercentage < 100) {
        newState = PlaybackState.BUFFERING;
    }

    if (this.currentState !== newState) {
      this.setState(newState);
    }

    // Update Session & Emit Progress
    if (this.session && info.duration > 0) {
      this.session.currentTime = info.currentTime;
      this.session.duration = info.duration;
      this.session.bufferingPercentage = info.bufferingPercentage;
      
      const percentage = (info.currentTime / info.duration) * 100;
      
      this.eventBus.emit('PLAYBACK_PROGRESS', {
        currentTime: info.currentTime,
        duration: info.duration,
        percentageWatched: percentage
      });

      // Periodically save progress
      if (info.state === AVPlayPlayerState.PLAYING && Math.floor(info.currentTime) % 10 === 0) {
        this.historyService.saveProgress(this.session.media.id, this.session.stream.id, info.currentTime, info.duration);
      }
    }

    if (info.bufferingPercentage < 100) {
       this.eventBus.emit('PLAYBACK_BUFFER', { percentage: info.bufferingPercentage });
    }
  }

  private setState(state: PlaybackState) {
    this.logger.info(`[PlaybackManager] State changed: ${this.currentState} -> ${state}`);
    this.currentState = state;
    if (this.session) {
      this.session.state = state;
    }
    this.eventBus.emit('PLAYBACK_STATE_CHANGED', { state });

    if (state === PlaybackState.COMPLETED && this.session) {
      this.historyService.markCompleted(this.session.media.id);
      this.eventBus.emit('PLAYBACK_COMPLETED');
    }
  }

  private async handlePlaybackError(error: PlaybackError) {
    this.logger.error(`[PlaybackManager] Error: ${error.category} - ${error.message}`);
    this.setState(PlaybackState.ERROR);
    
    const shouldRetry = error.category === PlaybackErrorCategory.NETWORK || 
                        error.category === PlaybackErrorCategory.TIMEOUT ||
                        error.category === PlaybackErrorCategory.AVPLAY;

    if (shouldRetry && this.retryCount < this.config.maxRetries && this.lastStreamSource && this.lastMedia && this.session) {
      this.retryCount++;
      const delay = this.config.retryDelayMs * Math.pow(2, this.retryCount - 1);
      this.logger.info(`[PlaybackManager] Retrying playback (${this.retryCount}/${this.config.maxRetries}) in ${delay}ms...`);
      
      const retrySource = { ...this.lastStreamSource };
      const retryMedia = { ...this.lastMedia };
      setTimeout(() => {
        if (this.session) {
          this.playStream(retrySource, retryMedia, this.session.currentTime);
        }
      }, delay);
    } else {
      this.eventBus.emit('PLAYBACK_ERROR', { error });
    }
  }

  public async playStream(stream: StreamSource | null, media: MediaItem, startTimeSeconds: number = 0): Promise<void> {
    if (!stream || !stream.url) {
      this.logger.error('[PlaybackManager] No stream URL supplied.');
      this.handlePlaybackError({
        category: PlaybackErrorCategory.NO_STREAM_AVAILABLE,
        message: 'No playable stream available.'
      });
      return;
    }

    this.logger.info(`[PlaybackManager] Preparing stream: ${media.id}`);
    
    this.lastStreamSource = stream;
    this.lastMedia = media;
    
    this.session = new PlaybackSession(media, stream, startTimeSeconds);
    this.setState(PlaybackState.LOADING);

    try {
      await this.avplayManager.prepareStream(stream, startTimeSeconds);
      this.avplayManager.play();
    } catch (err: any) {
      this.handlePlaybackError({
        category: PlaybackErrorCategory.AVPLAY,
        message: err.message || 'Failed to prepare or play stream',
        originalError: err
      });
    }
  }

  public play(): void {
    if (!this.session || !this.session.stream.url) {
      this.logger.warn('[PlaybackManager] Playback requested before stream resolution or session unavailable.');
      return;
    }
    
    // Ignore duplicate or illegal play requests
    if (this.currentState === PlaybackState.LOADING || 
        this.currentState === PlaybackState.BUFFERING || 
        this.currentState === PlaybackState.PLAYING) {
      this.logger.info(`[PlaybackManager] Ignoring play() in state ${this.currentState}`);
      return;
    }

    if (this.currentState === PlaybackState.IDLE || 
        this.currentState === PlaybackState.STOPPED || 
        this.currentState === PlaybackState.ERROR) {
      this.logger.warn(`[PlaybackManager] Cannot transition to play from ${this.currentState}`);
      return;
    }

    if (this.currentState === PlaybackState.PAUSED || this.currentState === PlaybackState.SEEKING) {
       this.avplayManager.play();
    }
  }

  public pause(): void {
    if (this.currentState === PlaybackState.PLAYING || this.currentState === PlaybackState.BUFFERING) {
      this.avplayManager.pause();
    }
  }

  public stop(): void {
    if (this.session) {
        this.historyService.saveProgress(this.session.media.id, this.session.stream.id, this.session.currentTime, this.session.duration);
    }
    this.avplayManager.stop();
    this.session = null;
    this.lastStreamSource = null;
    this.lastMedia = null;
    this.retryCount = 0;
  }

  public seek(seconds: number): void {
    this.avplayManager.seek(seconds);
    this.setState(PlaybackState.SEEKING);
    this.eventBus.emit('PLAYBACK_SEEK_COMPLETED');
  }

  public fastForward(seconds: number = 10): void {
    if (this.session) {
      this.seek(this.session.currentTime + seconds);
    }
  }

  public rewind(seconds: number = 10): void {
    if (this.session) {
      this.seek(Math.max(0, this.session.currentTime - seconds));
    }
  }

  public getSession(): PlaybackSession | null {
    return this.session;
  }

  public getState(): PlaybackState {
    return this.currentState;
  }

  // Audio & Subtitles (Delegates to AVPlayManager if supported, else stubs)
  
  public getAudioTracks(): AudioTrack[] {
    return this.avplayManager.getAudioTracks();
  }

  public setAudioTrack(index: number): void {
    this.avplayManager.setAudioTrack(index);
    if (this.session) {
       const tracks = this.getAudioTracks();
       const track = tracks.find(t => t.index === index);
       this.session.selectedAudioTrack = track ? track.index : null;
    }
    this.eventBus.emit('PLAYBACK_TRACK_CHANGED', { type: 'audio', trackIndex: index });
  }

  public getSubtitleTracks(): SubtitleTrack[] {
    return this.avplayManager.getSubtitleTracks();
  }

  public setSubtitleTrack(index: number | null): void {
    this.avplayManager.setSubtitleTrack(index);
    if (this.session) {
       const tracks = this.getSubtitleTracks();
       const track = index !== null ? tracks.find(t => t.index === index) : undefined;
       this.session.selectedSubtitleTrack = track ? track.index : null;
    }
    this.eventBus.emit('PLAYBACK_TRACK_CHANGED', { type: 'subtitle', trackIndex: index });
  }

  public destroy(): void {
    this.stop();
    if (this.avplayListenerCleanup) {
      this.avplayListenerCleanup();
    }
  }
}

/**
 * StreamIndian - Samsung Tizen AVPlay Player Abstraction
 * Handles native webapis.avplay calls on Samsung TV while providing a simulated HTML5 bridge for Web Preview.
 */

import { AVPlayPlayerState, AVPlayPlaybackInfo, StreamSource } from '../types/tizen';
import type Hls from 'hls.js';
import type { AVPlayAdapter } from './playback/AVPlayAdapter';

type NativeAVPlay = {
  open(url: string): void;
  setDisplayRect(x: number, y: number, width: number, height: number): void;
  setStreamingProperty?(name: string, value: string): void;
  setListener(listener: Record<string, (...args: any[]) => void>): void;
  prepareAsync(success: () => void, failure: (error: unknown) => void): void;
  getDuration(): number;
  seekTo(timeMs: number): void;
  play(): void;
  pause(): void;
  stop(): void;
  close(): void;
  getTotalTrackInfo(): any[];
  setSelectTrack(type: string, index: number): void;
  getVolume?(): number;
  setVolume?(volume: number): void;
  setExternalSubtitlePath?(url: string): void;
};

export interface AVPlayManagerOptions {
  nativeApi?: NativeAVPlay | null;
  prepareTimeoutMs?: number;
}

export type AVPlayEventCallback = (info: AVPlayPlaybackInfo) => void;

export class AVPlayManager implements AVPlayAdapter {
  private currentState: AVPlayPlayerState = AVPlayPlayerState.NONE;
  private videoElement: HTMLVideoElement | null = null;
  private currentStream: StreamSource | null = null;
  private listeners: Set<AVPlayEventCallback> = new Set();
  private currentTime = 0;
  private duration = 0;
  private bufferingPercentage = 100;
  private isNativeAVPlay = false;
  private hls: Hls | null = null;
  private lastError: any = null;
  private nativeApi: NativeAVPlay | null;
  private prepareTimeoutMs: number;
  private sessionGeneration = 0;
  private prepareTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingPrepareCancel: ((reason: Error) => void) | null = null;
  private visibilityListener: (() => void) | null = null;
  private pendingVideoCleanups: Array<() => void> = [];

  constructor(options: AVPlayManagerOptions = {}) {
    this.nativeApi = options.nativeApi === undefined ? this.findNativeApi() : options.nativeApi;
    this.isNativeAVPlay = this.nativeApi !== null;
    this.prepareTimeoutMs = options.prepareTimeoutMs ?? 30000;
    this.setupVisibilityListeners();
  }

  private findNativeApi(): NativeAVPlay | null {
    if (typeof window !== 'undefined' && (window as any).webapis?.avplay) {
      this.isNativeAVPlay = true;
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('[AVPlayManager] Native Samsung AVPlay (webapis.avplay) detected.');
      return (window as any).webapis.avplay;
    } else {
      this.isNativeAVPlay = false;
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('[AVPlayManager] Web Preview Mode: Using HTML5 Video with AVPlay Bridge emulation.');
      return null;
    }
  }

  
  private setupVisibilityListeners() {
    if (typeof document !== 'undefined') {
      this.visibilityListener = () => {
        if (this.isNativeAVPlay && this.nativeApi) {
          if (document.hidden) {
            if (this.currentState === AVPlayPlayerState.PLAYING || this.currentState === AVPlayPlayerState.PAUSED) {
               try {
                 (this.nativeApi as any).suspend?.();
                 if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('[AVPlayManager] suspended');
               } catch(e) { console.warn('[AVPlayManager] suspend error', e); }
            }
          } else {
            if (this.currentState === AVPlayPlayerState.PLAYING || this.currentState === AVPlayPlayerState.PAUSED) {
               try {
                 (this.nativeApi as any).restore?.();
                 if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('[AVPlayManager] restored');
               } catch(e) { console.warn('[AVPlayManager] restore error', e); }
            }
          }
        }
      };
      document.addEventListener('visibilitychange', this.visibilityListener);
    }
  }

  public clearVideoContainer() {
    this.clearPendingVideoListeners();
    if (this.videoElement) {
      this.videoElement.onended = null;
      this.videoElement.ontimeupdate = null;
      this.videoElement.onplay = null;
      this.videoElement.onpause = null;
      this.videoElement.onerror = null;
    }
    this.videoElement = null;
  }

  public registerVideoContainer(element: HTMLVideoElement) {
    this.clearVideoContainer();
    this.videoElement = element;
    if (this.videoElement) {
      this.videoElement.onended = () => {
        this.setState(AVPlayPlayerState.STOPPED);
      };
      this.videoElement.ontimeupdate = () => {
        if (this.videoElement) {
          this.currentTime = this.videoElement.currentTime;
          this.duration = this.videoElement.duration || 0;
          this.notifyListeners();
        }
      };
      this.videoElement.onplay = () => {
        this.setState(AVPlayPlayerState.PLAYING);
      };
      this.videoElement.onpause = () => {
        this.setState(AVPlayPlayerState.PAUSED);
      };
      this.videoElement.onerror = (event: any) => {
        const error = this.videoElement?.error;
        const msg = error ? (error.message || `Code ${error.code}`) : 'Unknown error';
        console.error('[AVPlayManager] HTML5 Video Error:', msg);
        console.error('[AVPlayManager] HTML5 Diagnostics:', {
          streamOrigin: safeStreamOrigin(this.currentStream?.url),
          currentSrcOrigin: safeStreamOrigin(this.videoElement?.currentSrc),
          error: this.videoElement?.error,
          readyState: this.videoElement?.readyState,
          networkState: this.videoElement?.networkState,
          canPlayHLS: this.videoElement?.canPlayType('application/vnd.apple.mpegurl'),
          canPlayMP4: this.videoElement?.canPlayType('video/mp4')
        });
        this.lastError = msg;
        this.setState(AVPlayPlayerState.ERROR);
      };
    }
  }

  public isAVPlayAvailable(): boolean {
    return this.isNativeAVPlay;
  }

  public async prepareStream(stream: StreamSource, startTimeSeconds: number = 0, signal?: AbortSignal): Promise<void> {
    this.cancelPendingPrepare(this.createAbortError('Playback session replaced'));
    this.clearPendingVideoListeners();
    if (this.currentStream && this.isNativeAVPlay) {
      try { this.nativeApi?.stop(); } catch { /* The native player may not yet be prepared. */ }
      try { this.nativeApi?.close(); } catch { /* The native player may already be closed. */ }
    }
    const generation = ++this.sessionGeneration;
    this.currentStream = stream;
    this.lastError = null;
    this.currentTime = Math.max(0, startTimeSeconds);
    this.duration = 0;
    this.setState(AVPlayPlayerState.IDLE);

    
    if (this.isNativeAVPlay) {
      if (stream.dolbyVision) {
         const error = new Error('PLAYER_ERROR_NOT_SUPPORTED_FILE: Dolby Vision is not supported on Samsung Tizen.');
         this.lastError = error;
         this.setState(AVPlayPlayerState.ERROR);
         return Promise.reject(error);
      }

      try {
        const audiocontrol = typeof window !== 'undefined' ? (window as any).webapis?.audiocontrol : undefined;
        if (audiocontrol) {
           audiocontrol.setOutputMode('AUTO');
        }
      } catch (e) {
        console.warn('[AVPlay] Failed to set audio passthrough', e);
      }

      return new Promise<void>((resolve, reject) => {

        try {
          const avplay = this.nativeApi;
          if (!avplay) throw new Error('Samsung AVPlay is unavailable');
          avplay.open(stream.url);

          // Samsung measures AVPlay output in a 1920x1080 coordinate space.
          avplay.setDisplayRect(0, 0, 1920, 1080);

          try {
             if (stream.format === 'HLS' || stream.format === 'DASH' || stream.url.includes('.m3u8') || stream.url.includes('.mpd')) {
                avplay.setStreamingProperty('ADAPTIVE_INFO', 'BITRATES=100000~100000000|STARTBITRATE=HIGHEST');
             }
          } catch (e) {
             console.warn('[AVPlay] setStreamingProperty failed', e);
          }

          avplay.setListener({
            onbufferingstart: () => {
              if (generation !== this.sessionGeneration) return;
              this.bufferingPercentage = 0;
              this.notifyListeners();
            },
            onbufferingprogress: (percent: number) => {
              if (generation !== this.sessionGeneration) return;
              this.bufferingPercentage = percent;
              this.notifyListeners();
            },
            onbufferingcomplete: () => {
              if (generation !== this.sessionGeneration) return;
              this.bufferingPercentage = 100;
              this.notifyListeners();
            },
            oncurrentplaytime: (timeMs: number) => {
              if (generation !== this.sessionGeneration) return;
              this.currentTime = timeMs / 1000;
              this.notifyListeners();
            },
            onstreamcompleted: () => {
              if (generation !== this.sessionGeneration) return;
              this.setState(AVPlayPlayerState.STOPPED);
            },
            onerror: (error: any) => {
              if (generation !== this.sessionGeneration) return;
              console.error('[AVPlay Native Error]', error);
              this.lastError = error;
              this.setState(AVPlayPlayerState.ERROR);
              this.pendingPrepareCancel?.(error instanceof Error ? error : new Error(String(error)));
              this.sessionGeneration++;
            }
          });

          let settled = false;
          const finish = (callback: () => void) => {
            if (settled || generation !== this.sessionGeneration) return;
            settled = true;
            this.clearPrepareTimer();
            if (this.pendingPrepareCancel) this.pendingPrepareCancel = null;
            signal?.removeEventListener('abort', onAbort);
            callback();
          };
          const onAbort = () => {
            finish(() => {
              const error = signal?.reason ?? this.createAbortError('Playback preparation cancelled');
              reject(error);
              this.stop();
            });
          };
          this.pendingPrepareCancel = (reason) => finish(() => reject(reason));
          const timeoutError = new Error(`AVPlay preparation timed out after ${this.prepareTimeoutMs}ms`);
          this.prepareTimer = setTimeout(() => finish(() => {
            this.sessionGeneration++;
            try { avplay.stop(); } catch { /* Best-effort cleanup after a prepare timeout. */ }
            try { avplay.close(); } catch { /* Best-effort cleanup after a prepare timeout. */ }
            this.lastError = timeoutError;
            this.setState(AVPlayPlayerState.ERROR);
            reject(timeoutError);
          }), this.prepareTimeoutMs);
          if (signal?.aborted) {
            onAbort();
            return;
          }
          signal?.addEventListener('abort', onAbort, { once: true });
          avplay.prepareAsync(
            () => {
              if (generation !== this.sessionGeneration) return;
              try {
                this.duration = avplay.getDuration() / 1000;
                if (startTimeSeconds > 0) {
                  avplay.seekTo(startTimeSeconds * 1000);
                }
                finish(() => {
                  this.setState(AVPlayPlayerState.PREPARED);
                  resolve();
                });
              } catch (err) {
                console.error('[AVPlay Post-Prepare Error]', err);
                finish(() => {
                  this.sessionGeneration++;
                  this.lastError = err;
                  this.setState(AVPlayPlayerState.ERROR);
                  reject(err);
                });
              }
            },
            (error: any) => {
              if (generation !== this.sessionGeneration) return;
              console.error('[AVPlay PrepareAsync Error]', error);
              finish(() => {
                this.sessionGeneration++;
                this.lastError = error;
                this.setState(AVPlayPlayerState.ERROR);
                reject(error);
              });
            }
          );
        } catch (e) {
          console.error('[AVPlay Prepare Error]', e);
          this.sessionGeneration++;
          this.lastError = e;
          this.setState(AVPlayPlayerState.ERROR);
          reject(e);
        }
      });
    } else {
      // HTML5 emulation
      return new Promise<void>((resolve, reject) => {
        let settled = false;
        const finish = (callback: () => void) => {
          if (settled || generation !== this.sessionGeneration) return;
          settled = true;
          this.clearPrepareTimer();
          this.pendingPrepareCancel = null;
          signal?.removeEventListener('abort', onAbort);
          callback();
        };
        const onAbort = () => finish(() => reject(signal?.reason ?? this.createAbortError('Playback preparation cancelled')));
        this.pendingPrepareCancel = (reason) => finish(() => reject(reason));
        const timeoutError = new Error(`Video preparation timed out after ${this.prepareTimeoutMs}ms`);
        this.prepareTimer = setTimeout(() => finish(() => {
          this.sessionGeneration++;
          this.lastError = timeoutError;
          this.setState(AVPlayPlayerState.ERROR);
          reject(timeoutError);
        }), this.prepareTimeoutMs);
        if (signal?.aborted) {
          onAbort();
          return;
        }
        signal?.addEventListener('abort', onAbort, { once: true });

        if (this.videoElement) {
          if (this.hls) {
            this.hls.destroy();
            this.hls = null;
          }

          const onReady = () => {
             if (generation !== this.sessionGeneration) return;
             finish(() => {
               this.duration = this.videoElement?.duration || 0;
               if (startTimeSeconds > 0) this.videoElement!.currentTime = startTimeSeconds;
               this.setState(AVPlayPlayerState.PREPARED);
               resolve();
             });
          };

          const onError = (e: any, errInfo: any) => {
             if (generation !== this.sessionGeneration) return;
             const msg = errInfo ? (errInfo.message || `Code ${errInfo.code}`) : 'Unknown error';
             console.error('[AVPlayManager] HTML5 Video Error:', msg);
             console.error('[AVPlayManager] HTML5 Diagnostics:', {
                streamOrigin: safeStreamOrigin(stream.url),
                currentSrcOrigin: safeStreamOrigin(this.videoElement?.currentSrc),
               error: this.videoElement?.error,
               readyState: this.videoElement?.readyState,
               networkState: this.videoElement?.networkState,
               canPlayHLS: this.videoElement?.canPlayType('application/vnd.apple.mpegurl'),
               canPlayMP4: this.videoElement?.canPlayType('video/mp4')
             });
             finish(() => {
               this.sessionGeneration++;
               this.lastError = msg;
               this.setState(AVPlayPlayerState.ERROR);
               reject(new Error(msg));
             });
          };

          if (stream.url.includes('.m3u8')) {
            import('hls.js').then(({ default: Hls }) => {
              if (generation !== this.sessionGeneration) return;
              if (Hls.isSupported()) {
                const hls = new Hls();
                this.hls = hls;
                hls.loadSource(stream.url);
                hls.attachMedia(this.videoElement!);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                  if (generation !== this.sessionGeneration || !this.videoElement) return;
                  // Wait for video element to have metadata
                  if (this.videoElement!.readyState >= 1) {
                    onReady();
                  } else {
                    this.listenVideoOnce(this.videoElement!, 'loadedmetadata', onReady);
                  }
                });
                hls.on(Hls.Events.ERROR, (event, data) => {
                  if (generation !== this.sessionGeneration) return;
                  if (data.fatal) {
                    switch (data.type) {
                      case Hls.ErrorTypes.NETWORK_ERROR:
                        console.error('fatal network error encountered, try to recover');
                        hls.startLoad();
                        break;
                      case Hls.ErrorTypes.MEDIA_ERROR:
                        console.error('fatal media error encountered, try to recover');
                        hls.recoverMediaError();
                        break;
                      default:
                        hls.destroy();
                        onError(event, data);
                        break;
                    }
                  }
                });
              } else if (this.videoElement!.canPlayType('application/vnd.apple.mpegurl')) {
                this.videoElement!.src = stream.url;
                this.listenVideoOnce(this.videoElement!, 'loadedmetadata', onReady);
                this.listenVideoOnce(this.videoElement!, 'error', (e) => onError(e, this.videoElement?.error));
                this.videoElement!.load();
              } else {
                this.videoElement!.src = stream.url;
                this.listenVideoOnce(this.videoElement!, 'loadedmetadata', onReady);
                this.listenVideoOnce(this.videoElement!, 'error', (e) => onError(e, this.videoElement?.error));
                this.videoElement!.load();
              }
            }).catch(err => {
              console.error('Failed to load hls.js', err);
              onError('Failed to load HLS library', err);
            });
          } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            this.videoElement.src = stream.url;
            this.listenVideoOnce(this.videoElement, 'loadedmetadata', onReady);
            this.listenVideoOnce(this.videoElement, 'error', (e) => onError(e, this.videoElement?.error));
            this.videoElement.load();
          } else {
            this.videoElement.src = stream.url;
            this.listenVideoOnce(this.videoElement, 'loadedmetadata', onReady);
            this.listenVideoOnce(this.videoElement, 'error', (e) => onError(e, this.videoElement?.error));
            this.videoElement.load();
          }
        } else {
          finish(() => reject(new Error('No video element registered')));
        }
      });
    }
  }

  public play() {
        if (this.isNativeAVPlay) {
      if (this.currentState !== AVPlayPlayerState.PREPARED && 
          this.currentState !== AVPlayPlayerState.PAUSED && 
          this.currentState !== AVPlayPlayerState.PLAYING) {
          console.warn('[AVPlay Play Error] Cannot play from state:', this.currentState);
          return;
      }
      try {
        this.nativeApi?.play();
        this.setState(AVPlayPlayerState.PLAYING);
      } catch (e) {
        console.error('[AVPlay Play Error]', e);
        this.sessionGeneration++;
        this.lastError = e;
        this.setState(AVPlayPlayerState.ERROR);
      }
    } else if (this.videoElement) {
      // STEP 2: BEFORE CALLING PLAY()
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('--- STEP 2: BEFORE HTML5 PLAY() ---');
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('video.currentSrc:', this.videoElement.currentSrc);
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('video.readyState:', this.videoElement.readyState);
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('video.networkState:', this.videoElement.networkState);
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('video.paused:', this.videoElement.paused);
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('video.ended:', this.videoElement.ended);
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('video.canPlayType("video/mp4"):', this.videoElement.canPlayType('video/mp4'));
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('video.canPlayType("video/webm"):', this.videoElement.canPlayType('video/webm'));
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('video.canPlayType("application/vnd.apple.mpegurl"):', this.videoElement.canPlayType('application/vnd.apple.mpegurl'));
      if ((typeof process !== "undefined" && process.env.NODE_ENV === "test") ? false : (import.meta as any).env?.DEV) console.log('-----------------------------------');

      this.videoElement.play().catch((err) => {
        console.warn('[AVPlay HTML5 Play Warning]', err);
      });
      this.setState(AVPlayPlayerState.PLAYING);
    }
  }

  public pause() {
        if (this.isNativeAVPlay) {
      if (this.currentState !== AVPlayPlayerState.PLAYING) {
         console.warn('[AVPlay Pause Error] Cannot pause from state:', this.currentState);
         return;
      }
      try {
        this.nativeApi?.pause();
        this.setState(AVPlayPlayerState.PAUSED);
      } catch (e) {
        console.error('[AVPlay Pause Error]', e);
        this.sessionGeneration++;
        this.lastError = e;
        this.setState(AVPlayPlayerState.ERROR);
      }
    } else if (this.videoElement) {
      this.videoElement.pause();
      this.setState(AVPlayPlayerState.PAUSED);
    }
  }

  public seek(seconds: number) {
    const target = Math.max(0, Math.min(seconds, this.duration || 99999));
    this.currentTime = target;

        if (this.isNativeAVPlay) {
      if (this.currentState !== AVPlayPlayerState.PLAYING && 
          this.currentState !== AVPlayPlayerState.PAUSED &&
          this.currentState !== AVPlayPlayerState.PREPARED) {
          console.warn('[AVPlay Seek Error] Cannot seek from state:', this.currentState);
          return;
      }
      try {
        this.nativeApi?.seekTo(target * 1000);
      } catch (e) {
        console.error('[AVPlay Seek Error]', e);
        this.sessionGeneration++;
        this.lastError = e;
        this.setState(AVPlayPlayerState.ERROR);
      }
    } else if (this.videoElement) {
      this.videoElement.currentTime = target;
    }
    this.notifyListeners();
  }

  public stop() {
    this.cancelPendingPrepare(this.createAbortError('Playback stopped'));
    this.sessionGeneration++;
    if (this.isNativeAVPlay) {
      try {
        this.nativeApi?.setListener({});
        if (this.currentState !== AVPlayPlayerState.NONE && this.currentState !== AVPlayPlayerState.STOPPED) {
          this.nativeApi?.stop();
          this.nativeApi?.close();
        }
      } catch (e) {
        console.error('[AVPlay Stop Error]', e);
      }
    } else if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.removeAttribute('src');
      if (this.hls) {
         this.hls.destroy();
         this.hls = null;
      }
    }
    this.currentStream = null;
    this.setState(AVPlayPlayerState.STOPPED);
  }

  public getState(): AVPlayPlayerState {
    return this.currentState;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getPlaybackInfo(): AVPlayPlaybackInfo {
    return {
      currentTime: this.currentTime,
      duration: this.duration,
      state: this.currentState,
      bufferingPercentage: this.bufferingPercentage,
      volume: this.videoElement
        ? this.videoElement.volume
        : Math.max(0, Math.min(1, (this.nativeApi?.getVolume?.() ?? 100) / 100)),
      isMuted: this.videoElement ? this.videoElement.muted : false,
      errorDetails: this.lastError
    };
  }

  // --- Audio Tracks ---
  public getAudioTracks(): { index: number; language: string; name?: string }[] {
    if (this.isNativeAVPlay && this.nativeApi) {
      try {
        const total = this.nativeApi.getTotalTrackInfo();
        return total.filter((t: any) => t.type === 'AUDIO').map((t: any) => ({
           index: t.index,
           language: t.extra_info?.language || 'Unknown'
        }));
      } catch (e) {
        console.warn('[AVPlay] Failed to get audio tracks', e);
      }
    }
    return [];
  }

  public setAudioTrack(index: number): void {
    if (this.isNativeAVPlay) {
      try {
        this.nativeApi?.setSelectTrack('AUDIO', index);
      } catch (e) {
        console.warn('[AVPlay] Failed to set audio track', e);
      }
    }
  }

  // --- Subtitle Tracks ---
  public getSubtitleTracks(): { index: number; language: string; name?: string }[] {
     if (this.isNativeAVPlay && this.nativeApi) {
      try {
        const total = this.nativeApi.getTotalTrackInfo();
        return total.filter((t: any) => t.type === 'TEXT').map((t: any) => ({
           index: t.index,
           language: t.extra_info?.language || 'Unknown'
        }));
      } catch (e) {
        console.warn('[AVPlay] Failed to get subtitle tracks', e);
      }
    }
    return [];
  }

  public setSubtitleTrack(index: number | null): void {
     if (this.isNativeAVPlay) {
      try {
        if (index === null) {
           // Turn off subtitles (often done by selecting an invalid index or via specific API depending on Tizen version)
           // Standard approach to disable might be selecting a track with no content, but usually we just hide OSD.
           // Setting track to -1 is a common convention to disable.
           this.nativeApi?.setSelectTrack('TEXT', -1);
        } else {
           this.nativeApi?.setSelectTrack('TEXT', index);
        }
      } catch (e) {
        console.warn('[AVPlay] Failed to set subtitle track', e);
      }
    }
  }

  
  public setExternalSubtitlePath(url: string): void {
     if (this.isNativeAVPlay) {
      try {
        this.nativeApi?.setExternalSubtitlePath?.(url);
      } catch (e) {
        console.warn('[AVPlay] Failed to set external subtitle path', e);
      }
    }
  }

  public setVolume(volume: number): void {
    const safeVolume = Math.max(0, Math.min(1, volume));
    try {
      if (this.isNativeAVPlay) this.nativeApi?.setVolume?.(Math.round(safeVolume * 100));
      else if (this.videoElement) this.videoElement.volume = safeVolume;
    } catch (error) {
      this.sessionGeneration++;
      this.lastError = error;
      this.setState(AVPlayPlayerState.ERROR);
    }
  }

  public addListener(callback: AVPlayEventCallback): () => void {

    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private setState(state: AVPlayPlayerState) {
    this.currentState = state;
    this.notifyListeners();
  }

  private notifyListeners() {
    const info = this.getPlaybackInfo();
    this.listeners.forEach((callback) => {
      try { callback(info); } catch (error) { console.error('[AVPlayManager] Listener failed', error); }
    });
  }

  private clearPrepareTimer(): void {
    if (this.prepareTimer !== null) {
      clearTimeout(this.prepareTimer);
      this.prepareTimer = null;
    }
  }

  private cancelPendingPrepare(reason: Error): void {
    this.clearPrepareTimer();
    const cancel = this.pendingPrepareCancel;
    this.pendingPrepareCancel = null;
    cancel?.(reason);
  }

  private createAbortError(message: string): Error {
    const error = new Error(message);
    error.name = 'AbortError';
    return error;
  }

  private listenVideoOnce(element: HTMLVideoElement, event: string, handler: (event: Event) => void): void {
    const remove = () => element.removeEventListener(event, wrapped);
    const wrapped = (eventObject: Event) => {
      remove();
      this.pendingVideoCleanups = this.pendingVideoCleanups.filter((cleanup) => cleanup !== remove);
      handler(eventObject);
    };
    this.pendingVideoCleanups.push(remove);
    element.addEventListener(event, wrapped);
  }

  private clearPendingVideoListeners(): void {
    this.pendingVideoCleanups.forEach((cleanup) => cleanup());
    this.pendingVideoCleanups = [];
  }

  public destroy(): void {
    this.stop();
    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }
    this.listeners.clear();
    this.clearVideoContainer();
  }
}

function safeStreamOrigin(value?: string | null): string {
  if (!value) return 'unavailable';
  try {
    return new URL(value).origin;
  } catch {
    return 'unavailable';
  }
}


/**
 * StreamIndian - Samsung Tizen AVPlay Player Abstraction
 * Handles native webapis.avplay calls on Samsung TV while providing a simulated HTML5 bridge for Web Preview.
 */

import { AVPlayPlayerState, AVPlayPlaybackInfo, StreamSource } from '../types/tizen';
import Hls from 'hls.js';

export type AVPlayEventCallback = (info: AVPlayPlaybackInfo) => void;

export class AVPlayManager {
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

  constructor() {
    this.detectAVPlayCapability();
    this.setupVisibilityListeners();
  }

  private detectAVPlayCapability() {
    if (typeof window !== 'undefined' && (window as any).webapis && (window as any).webapis.avplay) {
      this.isNativeAVPlay = true;
      if (import.meta.env.DEV) console.log('[AVPlayManager] Native Samsung AVPlay (webapis.avplay) detected.');
    } else {
      this.isNativeAVPlay = false;
      if (import.meta.env.DEV) console.log('[AVPlayManager] Web Preview Mode: Using HTML5 Video with AVPlay Bridge emulation.');
    }
  }

  
  private setupVisibilityListeners() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (this.isNativeAVPlay && (window as any).webapis && (window as any).webapis.avplay) {
          if (document.hidden) {
            if (this.currentState === AVPlayPlayerState.PLAYING || this.currentState === AVPlayPlayerState.PAUSED) {
               try {
                 (window as any).webapis.avplay.suspend();
                 if (import.meta.env.DEV) console.log('[AVPlayManager] suspended');
               } catch(e) { console.warn('[AVPlayManager] suspend error', e); }
            }
          } else {
            if (this.currentState === AVPlayPlayerState.PLAYING || this.currentState === AVPlayPlayerState.PAUSED) {
               try {
                 (window as any).webapis.avplay.restore();
                 if (import.meta.env.DEV) console.log('[AVPlayManager] restored');
               } catch(e) { console.warn('[AVPlayManager] restore error', e); }
            }
          }
        }
      });
    }
  }

  public registerVideoContainer(element: HTMLVideoElement) {
    this.videoElement = element;
    if (this.videoElement) {
      // STEP 3: Attach ALL HTML5 listeners
      const events = ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'play', 'playing', 'pause', 'waiting', 'stalled', 'suspend', 'abort', 'progress', 'seeking', 'seeked', 'ended', 'error'];
      events.forEach(evt => {
        this.videoElement.addEventListener(evt, (e) => {
          if (import.meta.env.DEV) console.log(`[HTML5 EVENT] ${evt} @ ${Date.now()}`);
        });
      });

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
          streamUrl: this.currentStream?.url,
          currentSrc: this.videoElement?.currentSrc,
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

  public async prepareStream(stream: StreamSource, startTimeSeconds: number = 0): Promise<void> {
    this.currentStream = stream;
    this.setState(AVPlayPlayerState.IDLE);

    
    if (this.isNativeAVPlay) {
      if (stream.dolbyVision) {
         const error = new Error('PLAYER_ERROR_NOT_SUPPORTED_FILE: Dolby Vision is not supported on Samsung Tizen.');
         this.lastError = error;
         this.setState(AVPlayPlayerState.ERROR);
         return Promise.reject(error);
      }

      try {
        const audiocontrol = (window as any).webapis.audiocontrol;
        if (audiocontrol) {
           audiocontrol.setOutputMode('AUTO');
        }
      } catch (e) {
        console.warn('[AVPlay] Failed to set audio passthrough', e);
      }

      return new Promise<void>((resolve, reject) => {

        try {
          const avplay = (window as any).webapis.avplay;
          avplay.open(stream.url);

          // Set display rectangle for Tizen TV AVPlay overlay
          avplay.setDisplayRect(0, 0, window.innerWidth, window.innerHeight);

          try {
             if (stream.format === 'HLS' || stream.format === 'DASH' || stream.url.includes('.m3u8') || stream.url.includes('.mpd')) {
                avplay.setStreamingProperty('ADAPTIVE_INFO', 'BITRATES=100000~100000000|STARTBITRATE=HIGHEST');
             }
          } catch (e) {
             console.warn('[AVPlay] setStreamingProperty failed', e);
          }

          avplay.setListener({
            onbufferingstart: () => {
              this.bufferingPercentage = 0;
              this.notifyListeners();
            },
            onbufferingprogress: (percent: number) => {
              this.bufferingPercentage = percent;
              this.notifyListeners();
            },
            onbufferingcomplete: () => {
              this.bufferingPercentage = 100;
              this.notifyListeners();
            },
            oncurrentplaytime: (timeMs: number) => {
              this.currentTime = timeMs / 1000;
              this.notifyListeners();
            },
            onstreamcompleted: () => {
              this.setState(AVPlayPlayerState.STOPPED);
            },
            onerror: (error: any) => {
              console.error('[AVPlay Native Error]', error);
              this.lastError = error;
              this.setState(AVPlayPlayerState.ERROR);
            }
          });

          avplay.prepareAsync(
            () => {
              try {
                this.duration = avplay.getDuration() / 1000;
                if (startTimeSeconds > 0) {
                  avplay.seekTo(startTimeSeconds * 1000);
                }
                this.setState(AVPlayPlayerState.PREPARED);
                resolve();
              } catch (err) {
                console.error('[AVPlay Post-Prepare Error]', err);
                reject(err);
              }
            },
            (error: any) => {
              console.error('[AVPlay PrepareAsync Error]', error);
              this.lastError = error;
              this.setState(AVPlayPlayerState.ERROR);
              reject(error);
            }
          );
        } catch (e) {
          console.error('[AVPlay Prepare Error]', e);
          this.lastError = e;
          this.setState(AVPlayPlayerState.ERROR);
          reject(e);
        }
      });
    } else {
      // HTML5 emulation
      return new Promise<void>((resolve, reject) => {
        if (this.videoElement) {
          if (this.hls) {
            this.hls.destroy();
            this.hls = null;
          }

          const onReady = () => {
             this.duration = this.videoElement?.duration || 0;
             if (startTimeSeconds > 0) this.videoElement!.currentTime = startTimeSeconds;
             this.setState(AVPlayPlayerState.PREPARED);
             resolve();
          };

          const onError = (e: any, errInfo: any) => {
             const msg = errInfo ? (errInfo.message || `Code ${errInfo.code}`) : 'Unknown error';
             console.error('[AVPlayManager] HTML5 Video Error:', msg);
             console.error('[AVPlayManager] HTML5 Diagnostics:', {
               streamUrl: stream.url,
               currentSrc: this.videoElement?.currentSrc,
               error: this.videoElement?.error,
               readyState: this.videoElement?.readyState,
               networkState: this.videoElement?.networkState,
               canPlayHLS: this.videoElement?.canPlayType('application/vnd.apple.mpegurl'),
               canPlayMP4: this.videoElement?.canPlayType('video/mp4')
             });
             this.lastError = msg;
             this.setState(AVPlayPlayerState.ERROR);
             reject(new Error(msg));
          };

          if (Hls.isSupported() && stream.url.includes('.m3u8')) {
            const hls = new Hls();
            this.hls = hls;
            hls.loadSource(stream.url);
            hls.attachMedia(this.videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              // Wait for video element to have metadata
              if (this.videoElement!.readyState >= 1) {
                onReady();
              } else {
                this.videoElement!.addEventListener('loadedmetadata', onReady, { once: true });
              }
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
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
          } else if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            this.videoElement.src = stream.url;
            this.videoElement.addEventListener('loadedmetadata', onReady, { once: true });
            this.videoElement.addEventListener('error', (e) => onError(e, this.videoElement?.error), { once: true });
            this.videoElement.load();
          } else {
            this.videoElement.src = stream.url;
            this.videoElement.addEventListener('loadedmetadata', onReady, { once: true });
            this.videoElement.addEventListener('error', (e) => onError(e, this.videoElement?.error), { once: true });
            this.videoElement.load();
          }
        } else {
          reject(new Error("No video element registered"));
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
        (window as any).webapis.avplay.play();
        this.setState(AVPlayPlayerState.PLAYING);
      } catch (e) {
        console.error('[AVPlay Play Error]', e);
      }
    } else if (this.videoElement) {
      // STEP 2: BEFORE CALLING PLAY()
      if (import.meta.env.DEV) console.log('--- STEP 2: BEFORE HTML5 PLAY() ---');
      if (import.meta.env.DEV) console.log('video.currentSrc:', this.videoElement.currentSrc);
      if (import.meta.env.DEV) console.log('video.readyState:', this.videoElement.readyState);
      if (import.meta.env.DEV) console.log('video.networkState:', this.videoElement.networkState);
      if (import.meta.env.DEV) console.log('video.paused:', this.videoElement.paused);
      if (import.meta.env.DEV) console.log('video.ended:', this.videoElement.ended);
      if (import.meta.env.DEV) console.log('video.canPlayType("video/mp4"):', this.videoElement.canPlayType('video/mp4'));
      if (import.meta.env.DEV) console.log('video.canPlayType("video/webm"):', this.videoElement.canPlayType('video/webm'));
      if (import.meta.env.DEV) console.log('video.canPlayType("application/vnd.apple.mpegurl"):', this.videoElement.canPlayType('application/vnd.apple.mpegurl'));
      if (import.meta.env.DEV) console.log('-----------------------------------');

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
        (window as any).webapis.avplay.pause();
        this.setState(AVPlayPlayerState.PAUSED);
      } catch (e) {
        console.error('[AVPlay Pause Error]', e);
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
        (window as any).webapis.avplay.seekTo(target * 1000);
      } catch (e) {
        console.error('[AVPlay Seek Error]', e);
      }
    } else if (this.videoElement) {
      this.videoElement.currentTime = target;
    }
    this.notifyListeners();
  }

  public stop() {
        if (this.isNativeAVPlay) {
      if (this.currentState === AVPlayPlayerState.NONE || 
          this.currentState === AVPlayPlayerState.IDLE || 
          this.currentState === AVPlayPlayerState.STOPPED) {
         return;
      }
      try {
        (window as any).webapis.avplay.stop();
        (window as any).webapis.avplay.close();
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
    this.setState(AVPlayPlayerState.STOPPED);
  }

  public getState(): AVPlayPlayerState {
    return this.currentState;
  }

  public getPlaybackInfo(): AVPlayPlaybackInfo {
    return {
      currentTime: this.currentTime,
      duration: this.duration || 120 * 60, // Fallback duration if metadata loading
      state: this.currentState,
      bufferingPercentage: this.bufferingPercentage,
      volume: this.videoElement ? this.videoElement.volume : 1,
      isMuted: this.videoElement ? this.videoElement.muted : false,
      errorDetails: this.lastError
    };
  }

  // --- Audio Tracks ---
  public getAudioTracks(): { index: number; language: string; name?: string }[] {
    if (this.isNativeAVPlay) {
      try {
        const total = (window as any).webapis.avplay.getTotalTrackInfo();
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
        (window as any).webapis.avplay.setSelectTrack('AUDIO', index);
      } catch (e) {
        console.warn('[AVPlay] Failed to set audio track', e);
      }
    }
  }

  // --- Subtitle Tracks ---
  public getSubtitleTracks(): { index: number; language: string; name?: string }[] {
     if (this.isNativeAVPlay) {
      try {
        const total = (window as any).webapis.avplay.getTotalTrackInfo();
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
           (window as any).webapis.avplay.setSelectTrack('TEXT', -1);
        } else {
           (window as any).webapis.avplay.setSelectTrack('TEXT', index);
        }
      } catch (e) {
        console.warn('[AVPlay] Failed to set subtitle track', e);
      }
    }
  }

  
  public setExternalSubtitlePath(url: string): void {
     if (this.isNativeAVPlay) {
      try {
        (window as any).webapis.avplay.setExternalSubtitlePath(url);
      } catch (e) {
        console.warn('[AVPlay] Failed to set external subtitle path', e);
      }
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
    this.listeners.forEach((callback) => callback(info));
  }
}


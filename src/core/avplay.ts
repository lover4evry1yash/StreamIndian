/**
 * StreamIndian - Samsung Tizen AVPlay Player Abstraction
 * Handles native webapis.avplay calls on Samsung TV while providing a simulated HTML5 bridge for Web Preview.
 */

import { AVPlayPlayerState, AVPlayPlaybackInfo, StreamSource } from '../types/tizen';

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

  constructor() {
    this.detectAVPlayCapability();
  }

  private detectAVPlayCapability() {
    if (typeof window !== 'undefined' && (window as any).webapis && (window as any).webapis.avplay) {
      this.isNativeAVPlay = true;
      console.log('[AVPlayManager] Native Samsung AVPlay (webapis.avplay) detected.');
    } else {
      this.isNativeAVPlay = false;
      console.log('[AVPlayManager] Web Preview Mode: Using HTML5 Video with AVPlay Bridge emulation.');
    }
  }

  public registerVideoContainer(element: HTMLVideoElement) {
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
      this.videoElement.onerror = () => {
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
      try {
        const avplay = (window as any).webapis.avplay;
        avplay.open(stream.url);

        // Set display rectangle for Tizen TV AVPlay overlay
        avplay.setDisplayRect(0, 0, window.innerWidth, window.innerHeight);

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
            this.setState(AVPlayPlayerState.ERROR);
          }
        });

        avplay.prepare();
        this.duration = avplay.getDuration() / 1000;
        if (startTimeSeconds > 0) {
          avplay.seekTo(startTimeSeconds * 1000);
        }
        this.setState(AVPlayPlayerState.PREPARED);
      } catch (e) {
        console.error('[AVPlay Prepare Error]', e);
        this.setState(AVPlayPlayerState.ERROR);
      }
    } else {
      // HTML5 emulation
      if (this.videoElement) {
        this.videoElement.src = stream.url;
        this.videoElement.currentTime = startTimeSeconds;
        this.setState(AVPlayPlayerState.PREPARED);
      }
    }
  }

  public play() {
    if (this.isNativeAVPlay) {
      try {
        (window as any).webapis.avplay.play();
        this.setState(AVPlayPlayerState.PLAYING);
      } catch (e) {
        console.error('[AVPlay Play Error]', e);
      }
    } else if (this.videoElement) {
      this.videoElement.play().catch((err) => {
        console.warn('[AVPlay HTML5 Play Warning]', err);
      });
      this.setState(AVPlayPlayerState.PLAYING);
    }
  }

  public pause() {
    if (this.isNativeAVPlay) {
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
      try {
        (window as any).webapis.avplay.stop();
        (window as any).webapis.avplay.close();
      } catch (e) {
        console.error('[AVPlay Stop Error]', e);
      }
    } else if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
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


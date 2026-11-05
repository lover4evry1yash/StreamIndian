import type { AVPlayPlaybackInfo, StreamSource } from '../../types/tizen';
import type { AudioTrack, SubtitleTrack } from './types';

/** Platform boundary used by playback services; implementations may wrap TV AVPlay or a test double. */
export interface AVPlayAdapter {
  prepareStream(stream: StreamSource, startTimeSeconds?: number, signal?: AbortSignal): Promise<void>;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  setVolume(volume: number): void;
  stop(): void;
  getState(): AVPlayPlaybackInfo['state'];
  getPlaybackInfo(): AVPlayPlaybackInfo;
  getCurrentTime(): number;
  getDuration(): number;
  isAVPlayAvailable(): boolean;
  getAudioTracks(): AudioTrack[];
  setAudioTrack(index: number): void;
  getSubtitleTracks(): SubtitleTrack[];
  setSubtitleTrack(index: number | null): void;
  addListener(callback: (info: AVPlayPlaybackInfo) => void): () => void;
  registerVideoContainer(element: HTMLVideoElement): void;
  clearVideoContainer(): void;
  destroy(): void;
}

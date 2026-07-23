export enum PlaybackState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  BUFFERING = 'BUFFERING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  SEEKING = 'SEEKING',
  COMPLETED = 'COMPLETED',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
}

export enum PlaybackErrorCategory {
  NETWORK = 'NETWORK',
  AVPLAY = 'AVPLAY',
  DRM = 'DRM',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  TIMEOUT = 'TIMEOUT',
  NO_STREAM_AVAILABLE = 'NO_STREAM_AVAILABLE',
  INVALID_STREAM = 'INVALID_STREAM',
  PLAYER_UNAVAILABLE = 'PLAYER_UNAVAILABLE',
  UNKNOWN = 'UNKNOWN',
}

export interface PlaybackError {
  category: PlaybackErrorCategory;
  message: string;
  originalError?: any;
}

export interface PlaybackSession {
  mediaId: string;
  title: string;
  streamUrl: string;
  currentTime: number;
  duration: number;
  selectedAudioTrack: string | null;
  selectedSubtitleTrack: string | null;
  playbackSpeed: number;
  resumePosition: number;
  isLive: boolean;
  startTimestamp: number;
}

export interface AudioTrack {
  index: number;
  language: string;
  name?: string;
}

export interface SubtitleTrack {
  index: number;
  language: string;
  name?: string;
}

export interface PlaybackStateEvent {
  state: PlaybackState;
}

export interface PlaybackProgressEvent {
  currentTime: number;
  duration: number;
  percentageWatched: number;
}

export interface PlaybackBufferEvent {
  percentage: number;
}

export interface PlaybackErrorEvent {
  error: PlaybackError;
}

export interface PlaybackTrackChangeEvent {
  type: 'audio' | 'subtitle';
  trackIndex: number | null; // null for off
}

/**
 * StreamIndian - Tizen TV Core Types
 */

export interface MediaItem {
  id: string;
  mediaType: 'movie' | 'series' | 'anime' | 'episode';
  seasonNumber?: number;
  episodeNumber?: number;
  title: string;
  originalTitle?: string;
  language: 'Hindi' | 'Tamil' | 'Telugu' | 'Malayalam' | 'Kannada' | 'Bengali' | 'Marathi' | 'Punjabi' | 'Gujarati' | 'English';
  year: number;
  durationMinutes: number;
  rating: string; // e.g. "U/A 13+", "U", "A"
  imdbRating?: number;
  genres: string[];
  posterUrl: string;
  backdropUrl: string;
  description: string;
  cast: string[];
  director: string;
  provider: string; // Legal source or catalog provider name
  isTrending?: boolean;
  isRegionalHero?: boolean;
  streams: StreamSource[];
  externalIds?: {
    tmdbId?: string;
    imdbId?: string;
    tvdbId?: string;
  };
}


export enum PlaybackReadiness {
  DIRECT = 'DIRECT',
  DEBRID_CACHED = 'DEBRID_CACHED',
  DEBRID_REQUIRED = 'DEBRID_REQUIRED',
  DIRECT_TORRENT = 'DIRECT_TORRENT',
  PARTIALLY_CACHED = 'PARTIALLY_CACHED',
  MULTI_PROVIDER_CACHED = 'MULTI_PROVIDER_CACHED',
  UNAVAILABLE = 'UNAVAILABLE'
}

export interface StreamPresentationModel {
  id: string;
  title: string;
  quality: string;
  format: string;
  codec?: string;
  audio?: string;
  hdr?: boolean;
  dolbyVision?: boolean;
  atmos?: boolean;
  bitrate?: number;
  size?: number;
  seeders?: number;
  readiness: PlaybackReadiness;
  score?: number;
  providerName: string;
  cacheMatrix: Record<string, boolean>; // e.g. { "torbox": true, "realdebrid": false }
  preferredDebrid?: string;
  isLegalPublicStream: boolean;
  streamSource: any; // Opaque reference back to the original source to avoid leaking provider specifics
}

export interface StreamSource {
  id: string;
  quality: '4K HDR' | '1080p FHD' | '720p HD' | 'SD';
  format: 'HLS' | 'DASH' | 'MP4';
  url: string;
  bitrate?: number;
  audioTrack?: string;
  isLegalPublicStream: boolean;
  providerName: string;
  readiness?: PlaybackReadiness;
  size?: number;
  seeders?: number;
  codec?: string;
  hdr?: boolean;
  dolbyVision?: boolean;
  atmos?: boolean;
  cacheStatus?: Record<string, boolean>;
  streamSource?: any;

}

export interface HistoryRecord {
  mediaId: string;
  title: string;
  posterUrl: string;
  watchedDurationSeconds: number;
  totalDurationSeconds: number;
  lastWatchedTimestamp: number;
  language: string;
}

export interface CatalogProvider {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  supportedLanguages: string[];
  isLegalSource: boolean;
  fetchCatalog: (languageFilter?: string, query?: string) => Promise<MediaItem[]>;
  resolveStream: (mediaId: string) => Promise<StreamSource[]>;
}

export type TizenKeyCode =
  | 'KEY_LEFT'
  | 'KEY_RIGHT'
  | 'KEY_UP'
  | 'KEY_DOWN'
  | 'KEY_ENTER'
  | 'KEY_RETURN' // Back button on Samsung Remote
  | 'KEY_PLAY'
  | 'KEY_PAUSE'
  | 'KEY_PLAY_PAUSE'
  | 'KEY_STOP'
  | 'KEY_RED'
  | 'KEY_GREEN'
  | 'KEY_YELLOW'
  | 'KEY_BLUE';

export enum AVPlayPlayerState {
  NONE = 'NONE',
  IDLE = 'IDLE',
  INITIALIZED = 'INITIALIZED',
  PREPARED = 'PREPARED',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
}

export interface AVPlayPlaybackInfo {
  currentTime: number; // in seconds
  duration: number; // in seconds
  state: AVPlayPlayerState;
  bufferingPercentage: number;
  volume: number;
  isMuted: boolean;
  errorDetails?: any;
}

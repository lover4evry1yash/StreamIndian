import { StreamSource } from '../../types/tizen';

export interface TorrentMetadata {
  infoHash: string;
  name: string;
  size: number;
  seeders?: number;
  sources?: string[];
}

export interface StreamResolution {
  id: string;
  title: string;
  url: string;
  quality: '4K HDR' | '4K' | '1080p FHD' | '720p HD' | 'SD' | 'UNKNOWN';
  format: 'HLS' | 'DASH' | 'MP4' | 'MKV' | 'UNKNOWN' | 'TORRENT';
  codec?: string;
  audioChannels?: string;
  subtitles?: string[];
  size?: number;
  seeders?: number;
  bitrate?: number;
  hdr?: boolean;
  dolbyVision?: boolean;
  atmos?: boolean;
  provider: string;
  resolver: string;
  health: number; // 0-100
  expiresAt?: number; // Unix timestamp
}

export interface ResolverHealth {
  isAvailable: boolean;
  latencyMs: number;
  reliability: number; // 0-100
  failureCount: number;
  lastSuccessfulResolution?: number; // Unix timestamp
  averageResolveTimeMs: number;
}

export interface ResolverDiagnostics {
  id: string;
  name: string;
  health: ResolverHealth;
  totalResolutions: number;
  cacheHitRate: number;
}

export interface IStreamResolver {
  readonly id: string;
  readonly name: string;
  readonly priority: number;
  
  initialize(context?: any): Promise<void>;
  healthCheck(): Promise<boolean>;
  getHealth(): ResolverHealth;
  
  supports(type: 'torrent' | 'url', payload: any): boolean;
  resolveTorrent?(torrent: TorrentMetadata): Promise<StreamResolution[]>;
  resolveUrl?(url: string): Promise<StreamResolution[]>;
}



export interface MediaSearchQuery {
  mediaId: string;
  type: 'movie' | 'episode' | 'live' | 'unknown';
  title: string;
  year?: number;
  season?: number;
  episode?: number;
  imdbId?: string;
  tmdbId?: string;
}

export interface CanonicalStreamSource {
  id: string;
  title: string;
  type: 'movie' | 'episode' | 'live' | 'unknown';
  sourceType: 'torrent' | 'magnet' | 'hls' | 'dash' | 'http' | 'https' | 'unknown';
  url?: string;
  magnet?: string;
  infoHash?: string;
  fileIndex?: number;
  torrentFile?: string;
  quality: '4K HDR' | '4K' | '1080p FHD' | '720p HD' | 'SD' | 'UNKNOWN';
  resolution?: string;
  format?: string;
  codec?: string;
  hdr?: boolean;
  dolbyVision?: boolean;
  audio?: string;
  atmos?: boolean;
  subtitles?: string[];
  language?: string;
  size?: number;
  bitrate?: number;
  seeders?: number;
  provider: string;
  releaseGroup?: string;
  metadata?: any;
  score?: number;
}

export interface ProviderHealth {
  isAvailable: boolean;
  latencyMs: number;
  reliability: number;
  failureCount: number;
  lastSuccessfulSearch?: number;
  averageSearchTimeMs: number;
}

export interface ISourceProvider {
  readonly id: string;
  readonly name: string;
  readonly priority: number;

  initialize(): Promise<void>;
  healthCheck(): Promise<boolean>;
  getHealth(): ProviderHealth;
  
  supports(query: MediaSearchQuery): boolean;
  search(query: MediaSearchQuery): Promise<CanonicalStreamSource[]>;
}

export interface StreamSortOptions {
  mode: 'best' | 'quality' | 'fastest' | 'size_asc' | 'size_desc' | 'seeders' | 'language' | 'newest' | 'priority';
  preferredLanguage?: string;
}

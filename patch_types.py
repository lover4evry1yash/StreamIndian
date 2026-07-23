content = open('src/core/streams/types.ts').read()

new_types = """
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
  torrentFile?: string;
  quality: '4K HDR' | '4K' | '1080p FHD' | '720p HD' | 'SD' | 'UNKNOWN';
  resolution?: string;
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
"""

if "CanonicalStreamSource" not in content:
    content += "\n" + new_types
    open('src/core/streams/types.ts', 'w').write(content)

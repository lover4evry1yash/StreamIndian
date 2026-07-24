import { NetworkClient } from '../NetworkClient';
import { CacheManager, StorageManager } from '../storage';
import { Logger } from '../Logger';
import { Config } from '../Config';
import { EventBus } from '../EventBus';
import { Movie, Series, Episode, Anime, MediaReference, UserList, Rating } from '../models/DomainModels';

export enum ProviderStatus {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  DEGRADED = 'DEGRADED',
  UNAVAILABLE = 'UNAVAILABLE',
  ERROR = 'ERROR'
}

export interface ProviderCapabilities {
  supportsSearch?: boolean;
  supportsMetadata?: boolean;
  supportsStreams?: boolean;
  supportsArtwork?: boolean;
  supportsSubtitles?: boolean;
  supportsRecommendations?: boolean;
  supportsPersonalization?: boolean;
  supportsCollections?: boolean;
  supportsCaching?: boolean;
  supportsAuthentication?: boolean;
  [key: string]: boolean | undefined;
}

export interface ProviderHealth {
  status: ProviderStatus;
  availability: number;
  latency: number;
  lastSuccessfulRequest: number;
  errorCount: number;
}

export enum ProviderErrorType {
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  RATE_LIMIT = 'RATE_LIMIT',
  PROVIDER_FAILURE = 'PROVIDER_FAILURE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  UNKNOWN = 'UNKNOWN',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  MERGE_CONFLICT = 'MERGE_CONFLICT',
  CAPABILITY_UNAVAILABLE = 'CAPABILITY_UNAVAILABLE',
  UNKNOWN_PROVIDER = 'UNKNOWN_PROVIDER'
}

export interface ProviderError {
  type: ProviderErrorType;
  message: string;
  statusCode?: number;
  originalError?: any;
}

export interface ProviderResult<T> {
  data?: T;
  error?: ProviderError;
  providerId: string;
  durationMs: number;
  cached: boolean;
}

import { SettingsManager } from '../storage/SettingsManager';
export interface ProviderContext {
  settingsManager: SettingsManager;
  network: NetworkClient;
  cache: CacheManager;
  storage: StorageManager;
  logger: Logger;
  config: Config;
  eventBus: EventBus;
}

export interface IProvider {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly priority: number;
  readonly enabled: boolean;
  readonly capabilities: ProviderCapabilities;
  readonly status: ProviderStatus;
  readonly rateLimits?: { requestsPerSecond: number; burstLimit: number; };
  
  initialize(context: ProviderContext): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<ProviderHealth>;
}

export interface IMetadataProvider extends IProvider {
  getMovie(id: string): Promise<Movie | null>;
  getSeries(id: string): Promise<Series | null>;
  getEpisodes(seriesId: string, season: number): Promise<Episode[] | null>;
  getAnime?(id: string): Promise<Anime | null>;
}

export interface IStreamProvider extends IProvider {
  getStreams(mediaId: string, type: 'movie' | 'episode', season?: number, episode?: number): Promise<any[]>;
}

export interface ISearchProvider extends IProvider {
  search(query: import('../search/types').SearchQuery): Promise<import('../search/types').SearchResult>;
}

export interface IArtworkProvider extends IProvider {
  getArtwork(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<import('../models/DomainModels').ArtworkSet | null>;
}

export interface ProviderCredential {
  id: string;
  value: string;
  type: 'secret' | 'public';
  expiresAt?: number;
}

export interface ProviderStatistics {
  requests: number;
  successes: number;
  failures: number;
  timeouts: number;
  averageLatencyMs: number;
}

export interface ProviderMergePolicy {
  overview: string[];
  episodes: string[];
  anime: string[];
  artwork: string[];
  poster: string[];
  ratings: string[];
  collections: string[];
  [key: string]: string[] | undefined;
}

export interface IPersonalizationProvider extends IProvider {
  getTrending?(type: 'movie' | 'series', options?: { language?: string; page?: number }): Promise<MediaReference[]>;
  getRecommendations?(type: 'movie' | 'series', id?: string): Promise<MediaReference[]>;
  getWatchHistory?(): Promise<MediaReference[]>;
  getContinueWatching?(): Promise<MediaReference[]>;
  getUserLists?(): Promise<UserList[]>;
  getListItems?(listId: string): Promise<MediaReference[]>;
}

export interface ICollectionProvider extends IProvider {
  getCollection(id: string): Promise<MediaReference[]>;
  getTopRated?(type: 'movie' | 'series', options?: { language?: string; page?: number }): Promise<MediaReference[]>;
  getPopular?(type: 'movie' | 'series', options?: { language?: string; page?: number }): Promise<MediaReference[]>;
}

export interface IRatingsProvider extends IProvider {
  getRatings(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<Rating[]>;
}
export type ProviderCapability = keyof ProviderCapabilities;

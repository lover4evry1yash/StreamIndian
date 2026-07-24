import { NetworkClient } from '../../NetworkClient';
import { CacheManager } from '../../storage/CacheManager';
import { CachePolicyType } from '../../storage/types';
import { Logger } from '../../Logger';
import { SettingsManager } from '../../storage/SettingsManager';

const BASE_URL = 'https://webservice.fanart.tv/v3';


export class FanartClient {
  private network: NetworkClient;
  private cache: CacheManager;
  private logger: Logger;
  private settings: SettingsManager;

  public metrics = {
    requests: 0,
    rateLimitsHit: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLatencyMs: 0
  };

  constructor(network: NetworkClient, cache: CacheManager, logger: Logger, settings: SettingsManager) {
    this.network = network;
    this.cache = cache;
    this.logger = logger;
    this.settings = settings;
  }

  private hasLoggedMissingKey = false;

  private async fetch<T>(path: string): Promise<T | null> {
    const apiKey = this.settings.getSettings().providers?.fanart?.apiKey;
    if (!apiKey) {
      if (!this.hasLoggedMissingKey) {
          this.logger.debug('Fanart API Key not configured. Disabling gracefully.');
          this.hasLoggedMissingKey = true;
      }
      return null;
    }
    const url = `${BASE_URL}${path}?api_key=${apiKey}`;
    try {
      this.metrics.requests++;
      const start = Date.now();
      const result = await this.network.getJson<any>(url);
      this.metrics.totalLatencyMs += (Date.now() - start);
      return result as T;
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        return null;
      }
      this.logger.error(`Fanart fetch failed for ${path}`, error);
      throw error;
    }
  }

  public async getMovieArtwork(tmdbId: string): Promise<any | null> {
    const cacheKey = `fanart_movie_${tmdbId}`;
    const cached = await this.cache.get(cacheKey, tmdbId, CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const data = await this.fetch<any>(`/movies/${tmdbId}`);
    if (data) {
      await this.cache.set(cacheKey, tmdbId, data, CachePolicyType.METADATA);
    }
    return data;
  }

  public async getTvArtwork(tvdbId: string): Promise<any | null> {
    const cacheKey = `fanart_tv_${tvdbId}`;
    const cached = await this.cache.get(cacheKey, tvdbId, CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const data = await this.fetch<any>(`/tv/${tvdbId}`);
    if (data) {
      await this.cache.set(cacheKey, tvdbId, data, CachePolicyType.METADATA);
    }
    return data;
  }
}

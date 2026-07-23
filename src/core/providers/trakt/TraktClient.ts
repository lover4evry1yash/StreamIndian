import { NetworkClient } from '../../NetworkClient';
import { CacheManager } from '../../storage/CacheManager';
import { CachePolicyType } from '../../storage/types';
import { Logger } from '../../Logger';

const BASE_URL = 'https://api.trakt.tv';
const TRAKT_CLIENT_ID = 'YOUR_TRAKT_CLIENT_ID';

export class TraktClient {
  private network: NetworkClient;
  private cache: CacheManager;
  private logger: Logger;

  public metrics = {
    requests: 0,
    rateLimitsHit: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLatencyMs: 0
  };

  constructor(network: NetworkClient, cache: CacheManager, logger: Logger) {
    this.network = network;
    this.cache = cache;
    this.logger = logger;
  }

  private async fetch<T>(path: string, options: any = {}, retries = 1): Promise<T> {
    const url = `${BASE_URL}${path}`;
    try {
      this.metrics.requests++;
      const start = Date.now();
      const result = await this.network.getJson<any>(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'trakt-api-version': '2',
          'trakt-api-key': TRAKT_CLIENT_ID,
          ...options.headers
        }
      });
      this.metrics.totalLatencyMs += (Date.now() - start);
      return result as T;
    } catch (error: any) {
      this.logger.error(`Trakt fetch failed for ${path}`, error);
      throw error;
    }
  }

  public async getTrending(type: 'movies' | 'shows'): Promise<any[]> {
    const cacheKey = `trakt_trending_${type}`;
    const cached = await this.cache.get(cacheKey, 'trending', CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached as any[];
    }
    this.metrics.cacheMisses++;

    const data = await this.fetch<any[]>(`/${type}/trending`);
    if (data) {
      await this.cache.set(cacheKey, 'trending', data, CachePolicyType.METADATA);
    }
    return data || [];
  }

  public async getRecommendations(type: 'movies' | 'shows', id?: string): Promise<any[]> {
    const cacheKey = `trakt_recommended_${type}_${id || 'general'}`;
    const cached = await this.cache.get(cacheKey, 'recommendations', CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached as any[];
    }
    this.metrics.cacheMisses++;

    // Trakt uses /recommendations/movies etc. Need OAuth for user-specific.
    // If no OAuth, we could return popular/anticipated.
    // For now we'll fetch popular as a fallback if no OAuth.
    const endpoint = id ? `/${type}/${id}/related` : `/${type}/popular`;
    const data = await this.fetch<any[]>(endpoint);
    
    if (data) {
      await this.cache.set(cacheKey, 'recommendations', data, CachePolicyType.METADATA);
    }
    return data || [];
  }
}

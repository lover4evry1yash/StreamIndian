import { NetworkClient } from '../../NetworkClient';
import { CacheManager } from '../../storage/CacheManager';
import { CachePolicyType } from '../../storage/types';
import { Logger } from '../../Logger';

const BASE_URL = 'https://mdblist.com/api';
const MDBLIST_API_KEY = 'YOUR_MDBLIST_API_KEY';

export class MDBListClient {
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
    const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}apikey=${MDBLIST_API_KEY}`;
    try {
      this.metrics.requests++;
      const start = Date.now();
      const result = await this.network.getJson<any>(url, options);
      this.metrics.totalLatencyMs += (Date.now() - start);
      return result as T;
    } catch (error: any) {
      this.logger.error(`MDBList fetch failed for ${path}`, error);
      throw error;
    }
  }

  public async getList(listId: string): Promise<any[]> {
    const cacheKey = `mdblist_list_${listId}`;
    const cached = await this.cache.get(cacheKey, listId, CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached as any[];
    }
    this.metrics.cacheMisses++;

    const data = await this.fetch<any[]>(`/lists/${listId}/items`);
    if (data) {
      await this.cache.set(cacheKey, listId, data, CachePolicyType.METADATA);
    }
    return data || [];
  }

  public async getTopRated(): Promise<any[]> {
    const cacheKey = `mdblist_top_rated`;
    const cached = await this.cache.get(cacheKey, 'top_rated', CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached as any[];
    }
    this.metrics.cacheMisses++;

    // MDBList has top lists, e.g., 'top-movies-all-time'
    const data = await this.fetch<any[]>(`/lists/top-movies-all-time/items`);
    if (data) {
      await this.cache.set(cacheKey, 'top_rated', data, CachePolicyType.METADATA);
    }
    return data || [];
  }
}

import { NetworkClient } from '../../NetworkClient';
import { CacheManager } from '../../storage/CacheManager';
import { CachePolicyType } from '../../storage/types';
import { Logger } from '../../Logger';

const BASE_URL = 'https://api4.thetvdb.com/v4';
const TVDB_API_KEY = 'YOUR_TVDB_API_KEY'; // Typically injected from config or env

export class TVDBClient {
  private network: NetworkClient;
  private cache: CacheManager;
  private logger: Logger;
  private token: string | null = null;
  private apiKey: string;
  private isAuthenticating: boolean = false;
  private authPromise: Promise<void> | null = null;
  private lastRequestTime: number = 0;
  
  // Diagnostics
  public metrics = {
    requests: 0,
    rateLimitsHit: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLatencyMs: 0
  };
  
  constructor(network: NetworkClient, cache: CacheManager, logger: Logger, apiKey: string = TVDB_API_KEY) {
    this.network = network;
    this.cache = cache;
    this.logger = logger;
    this.apiKey = apiKey;
  }

  private async rateLimitDelay() {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < 250) { // Limit to 4 requests per second
      await new Promise(r => setTimeout(r, 250 - timeSinceLast));
    }
    this.lastRequestTime = Date.now();
  }

  private async authenticate(): Promise<void> {
    if (this.isAuthenticating && this.authPromise) {
      return this.authPromise;
    }

    this.isAuthenticating = true;
    this.authPromise = (async () => {
      try {
        const cachedToken = await this.cache.get('tvdb', 'auth_token', CachePolicyType.SETTINGS);
        if (cachedToken) {
          this.token = cachedToken as string;
          this.isAuthenticating = false;
          return;
        }

        const res = await this.network.fetch(`${BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apikey: this.apiKey })
        });
        const response: any = await res.json();
        
        if (response && response.data && response.data.token) {
          this.token = response.data.token;
          await this.cache.set('tvdb', 'auth_token', this.token, CachePolicyType.SETTINGS); 
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        this.logger.error('TVDB Authentication failed', error);
        throw error;
      } finally {
        this.isAuthenticating = false;
      }
    })();

    return this.authPromise;
  }

  private async fetch<T>(path: string, options: any = {}, retries = 1): Promise<T> {
    if (!this.token) {
      await this.authenticate();
    }
    
    await this.rateLimitDelay();

    try {
      this.metrics.requests++;
      const start = Date.now();
      const result = await this.network.getJson<any>(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json'
        }
      });
      this.metrics.totalLatencyMs += (Date.now() - start);
      return result.data as T;
    } catch (error: any) {
      if (error.message && error.message.includes('401') && retries > 0) {
        // Token might be expired
        await this.cache.invalidate('tvdb', 'auth_token');
        this.token = null;
        return this.fetch<T>(path, options, retries - 1);
      }
      throw error;
    }
  }

  public async getSeriesExtended(id: string): Promise<any> {
    const cacheKey = `tvdb_series_ext_${id}`;
    const cached = await this.cache.get(cacheKey, id, CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const data = await this.fetch<any>(`/series/${id}/extended?meta=translations,episodes`);
    await this.cache.set(cacheKey, id, data, CachePolicyType.METADATA);
    return data;
  }

  public async getMovieExtended(id: string): Promise<any> {
    const cacheKey = `tvdb_movie_ext_${id}`;
    const cached = await this.cache.get(cacheKey, id, CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const data = await this.fetch<any>(`/movies/${id}/extended?meta=translations`);
    await this.cache.set(cacheKey, id, data, CachePolicyType.METADATA);
    return data;
  }
  
  public async getEpisodesBySeason(seriesId: string, seasonType: string = 'default'): Promise<any> {
    const cacheKey = `tvdb_episodes_${seriesId}_${seasonType}`;
    const cached = await this.cache.get(cacheKey, seriesId, CachePolicyType.METADATA);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const data = await this.fetch<any>(`/series/${seriesId}/episodes/${seasonType}`);
    await this.cache.set(cacheKey, seriesId, data, CachePolicyType.METADATA);
    return data;
  }
}

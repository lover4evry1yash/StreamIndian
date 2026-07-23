import { CacheManager } from './CacheManager';
import { CachePolicyType } from './types';

export class MetadataCache {
  private cache: CacheManager;
  
  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  public async getMovie(id: string): Promise<any | null> {
    return this.cache.get('movie', id, CachePolicyType.METADATA);
  }

  public async setMovie(id: string, data: any): Promise<void> {
    return this.cache.set('movie', id, data, CachePolicyType.METADATA);
  }

  public async getSeries(id: string): Promise<any | null> {
    return this.cache.get('series', id, CachePolicyType.METADATA);
  }

  public async setSeries(id: string, data: any): Promise<void> {
    return this.cache.set('series', id, data, CachePolicyType.METADATA);
  }

  public async getEpisodes(seriesId: string, season: number): Promise<any | null> {
    return this.cache.get('episodes', `${seriesId}_${season}`, CachePolicyType.METADATA);
  }

  public async setEpisodes(seriesId: string, season: number, data: any): Promise<void> {
    return this.cache.set('episodes', `${seriesId}_${season}`, data, CachePolicyType.METADATA);
  }

  public async getSearchResults(query: string): Promise<any | null> {
    return this.cache.get('search', query, CachePolicyType.PROVIDER_RESPONSES);
  }

  public async setSearchResults(query: string, data: any): Promise<void> {
    return this.cache.set('search', query, data, CachePolicyType.PROVIDER_RESPONSES);
  }
}

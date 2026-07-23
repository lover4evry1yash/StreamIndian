import { IPersonalizationProvider, ProviderContext, ProviderCapabilities, ProviderHealth, ProviderStatus } from '../types';
import { MediaReference } from '../../models/DomainModels';
import { TraktClient } from './TraktClient';
import { TraktMapper } from './TraktMapper';

import { IRatingsProvider } from '../types';
import { Rating } from '../../models/DomainModels';
export class TraktProvider implements IPersonalizationProvider, IRatingsProvider {
  public readonly id = 'trakt';
  public readonly name = 'Trakt.tv';
  public readonly version = '1.0.0';
  public readonly priority = 2;
  public readonly enabled = true;
  public readonly status = ProviderStatus.READY;
  public readonly capabilities: ProviderCapabilities = {
    "supportsRecommendations": true
};
  
  
  private client: TraktClient | null = null;
  private isInitialized = false;

  public async initialize(context: ProviderContext): Promise<void> {
    this.client = new TraktClient(context.network, context.cache, context.logger);
    this.isInitialized = true;
  }

  public async shutdown(): Promise<void> {
    this.client = null;
    this.isInitialized = false;
  }

  public async healthCheck(): Promise<ProviderHealth> {
    return {
      status: ProviderStatus.READY,
      availability: 1,
      latency: 0,
      lastSuccessfulRequest: Date.now(),
      errorCount: 0
    };
  }

  public reset(): void {
  }

  public async getTrending(type: 'movie' | 'series'): Promise<MediaReference[]> {
    if (!this.client) throw new Error('TraktProvider not initialized');
    const endpointType = type === 'movie' ? 'movies' : 'shows';
    const data = await this.client.getTrending(endpointType);
    return data.map(item => TraktMapper.mapMediaReference(item, type));
  }

  public async getRecommendations(type: 'movie' | 'series', id?: string): Promise<MediaReference[]> {
    if (!this.client) throw new Error('TraktProvider not initialized');
    const endpointType = type === 'movie' ? 'movies' : 'shows';
    const cleanId = id ? id.replace('trakt_', '').replace('tmdb_', '').replace('tvdb_', '') : undefined; // Simplified
    const data = await this.client.getRecommendations(endpointType, cleanId);
    return data.map(item => TraktMapper.mapMediaReference(item, type));
  }

  public async getWatchHistory(): Promise<MediaReference[]> {
    return []; // Requires OAuth implementation in full
  }

  public async getContinueWatching(): Promise<MediaReference[]> {
    return []; // Requires OAuth implementation in full
  }

  public async getUserLists(): Promise<any[]> {
    return []; // Requires OAuth implementation in full
  }

  public async getRatings(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<Rating[]> {
    if (!this.client) throw new Error('TraktProvider not initialized');
    // Implement ratings fetching via client if needed
    // Placeholder for now
    return [{ provider: 'trakt', score: 8.5 }];
  }

  public getDiagnostics() {
    if (!this.client) return null;
    const m = this.client.metrics;
    return {
      availability: this.isInitialized ? 'ONLINE' : 'OFFLINE',
      averageLatencyMs: m.requests > 0 ? Math.round(m.totalLatencyMs / m.requests) : 0,
      rateLimitsHit: m.rateLimitsHit,
      cacheHitRate: (m.cacheHits + m.cacheMisses) > 0 ? (m.cacheHits / (m.cacheHits + m.cacheMisses)) : 0,
      cacheHits: m.cacheHits,
      cacheMisses: m.cacheMisses
    };
  }
}

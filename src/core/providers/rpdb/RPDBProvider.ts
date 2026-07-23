import { IProvider, ProviderContext, ProviderCapabilities, ProviderHealth, ProviderStatus } from '../types';
import { ArtworkSet, Image } from '../../models/DomainModels';
import { RPDBClient } from './RPDBClient';

import { IArtworkProvider } from '../types';
export class RPDBProvider implements IArtworkProvider {
  public readonly id = 'rpdb';
  public readonly name = 'Rating Poster Database';
  public readonly version = '1.0.0';
  public readonly priority = 2;
  public readonly enabled = true;
  public readonly status = ProviderStatus.READY;
  public readonly capabilities: ProviderCapabilities = {
    "supportsArtwork": true
};
  
  
  private client: RPDBClient | null = null;
  private isInitialized = false;

  public async initialize(context: ProviderContext): Promise<void> {
    this.client = new RPDBClient(context.logger);
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

  public async getArtwork(type: 'movie' | 'series', externalIds: any): Promise<ArtworkSet | null> {
    if (!this.client) throw new Error('RPDBProvider not initialized');
    
    const posters: Image[] = [];
    
    if (type === 'movie' && externalIds.tmdbId) {
      posters.push({
        type: 'poster',
        url: this.client.getMoviePosterUrl(externalIds.tmdbId),
        provider: 'rpdb'
      });
    } else if (type === 'series' && externalIds.tvdbId) {
      posters.push({
        type: 'poster',
        url: this.client.getSeriesPosterUrl(externalIds.tvdbId),
        provider: 'rpdb'
      });
    } else if (type === 'series' && externalIds.tmdbId) {
       // fallback for series TMDB
       posters.push({
        type: 'poster',
        url: `https://api.ratingposterdb.com/YOUR_RPDB_API_KEY/tmdb/poster-default/show-${externalIds.tmdbId}.jpg`,
        provider: 'rpdb'
      });
    }
    
    if (posters.length === 0) return null;
    
    return {
      posters,
      backdrops: [],
      banners: [],
      landscapes: [],
      thumbs: [],
      logos: [],
      clearLogos: [],
      clearArts: [],
      discArts: [],
      characterArts: []
    };
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

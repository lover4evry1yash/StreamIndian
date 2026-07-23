import { IProvider, ProviderContext, ProviderCapabilities, ProviderHealth, ProviderStatus } from '../types';
import { ArtworkSet } from '../../models/DomainModels';
import { FanartClient } from './FanartClient';
import { FanartMapper } from './FanartMapper';

import { IArtworkProvider } from '../types';
export class FanartProvider implements IArtworkProvider {
  public readonly id = 'fanart';
  public readonly name = 'Fanart.tv';
  public readonly version = '1.0.0';
  public readonly priority = 2;
  public readonly enabled = true;
  public readonly status = ProviderStatus.READY;
  public readonly capabilities: ProviderCapabilities = {
    "supportsArtwork": true
};
  
  
  private client: FanartClient | null = null;
  private isInitialized = false;

  public async initialize(context: ProviderContext): Promise<void> {
    this.client = new FanartClient(context.network, context.cache, context.logger, context.settingsManager);
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

  public async getArtwork(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<ArtworkSet | null> {
    if (!this.client) throw new Error('FanartProvider not initialized');
    if (type === 'movie') {
      const tmdbId = externalIds?.tmdbId || mediaId;
      const data = await this.client.getMovieArtwork(tmdbId);
      if (data) return FanartMapper.mapMovie(data);
    } else {
      const tvdbId = externalIds?.tvdbId || mediaId;
      const data = await this.client.getTvArtwork(tvdbId);
      if (data) return FanartMapper.mapTv(data);
    }
    return null;
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

import { ICollectionProvider, ProviderContext, ProviderCapabilities, ProviderHealth, ProviderStatus } from '../types';
import { MediaReference } from '../../models/DomainModels';
import { MDBListClient } from './MDBListClient';
import { MDBListMapper } from './MDBListMapper';

import { IRatingsProvider } from '../types';
import { Rating } from '../../models/DomainModels';
export class MDBListProvider implements ICollectionProvider, IRatingsProvider {
  public readonly id = 'mdblist';
  public readonly name = 'MDBList';
  public readonly version = '1.0.0';
  public readonly priority = 2;
  public readonly enabled = true;
  public readonly status = ProviderStatus.READY;
  public readonly capabilities: ProviderCapabilities = {
    "supportsRecommendations": true
};
  
  
  private client: MDBListClient | null = null;
  private isInitialized = false;

  public async initialize(context: ProviderContext): Promise<void> {
    this.client = new MDBListClient(context.network, context.cache, context.logger);
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

  public async getCollection(id: string): Promise<MediaReference[]> {
    if (!this.client) throw new Error('MDBListProvider not initialized');
    const data = await this.client.getList(id);
    return data.map(item => MDBListMapper.mapMediaReference(item));
  }

  public async getTopRated(type: 'movie' | 'series'): Promise<MediaReference[]> {
    if (!this.client) throw new Error('MDBListProvider not initialized');
    const data = await this.client.getTopRated();
    return data
      .map(item => MDBListMapper.mapMediaReference(item))
      .filter(item => item.type === type);
  }
  
  public async getPopular(type: 'movie' | 'series'): Promise<MediaReference[]> {
    return this.getTopRated(type); // simplified
  }
  
  public async getRatings(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<Rating[]> {
    if (!this.client) throw new Error('MDBListProvider not initialized');
    // Implement ratings fetching via client if needed
    // Placeholder for now
    return [];
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

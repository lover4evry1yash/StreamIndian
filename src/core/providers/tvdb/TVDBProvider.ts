import { IMetadataProvider, ProviderCapabilities, ProviderHealth, ProviderStatus, ProviderContext } from '../types';
import { Movie, Series, Episode } from '../../models/DomainModels';
import { TVDBClient } from './TVDBClient';
import { TVDBMapper } from './TVDBMapper';

export class TVDBProvider implements IMetadataProvider {
  public readonly id = 'tvdb';
  public readonly name = 'TheTVDB';
  public readonly version = '1.0.0';
  public readonly priority = 2;
  public readonly enabled = true;
  public readonly status = ProviderStatus.READY;
  public readonly capabilities: ProviderCapabilities = {
    "supportsMetadata": true
};
  
  
  private client: TVDBClient | null = null;
  private isInitialized = false;

  public async initialize(context: ProviderContext): Promise<void> {
    this.client = new TVDBClient(context.network, context.cache, context.logger);
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

  public async getMovie(id: string): Promise<Movie | null> {
    if (!this.client) throw new Error('TVDBProvider not initialized');
    const cleanId = id.replace('tvdb_', '');
    const data = await this.client.getMovieExtended(cleanId);
    if (data) {
      return TVDBMapper.mapMovie(data);
    }
    return null;
  }

  public async getSeries(id: string): Promise<Series | null> {
    if (!this.client) throw new Error('TVDBProvider not initialized');
    const cleanId = id.replace('tvdb_', '');
    const data = await this.client.getSeriesExtended(cleanId);
    if (data) {
      return TVDBMapper.mapSeries(data);
    }
    return null;
  }

  public async getEpisodes(seriesId: string, seasonNumber: number): Promise<Episode[] | null> {
    if (!this.client) throw new Error('TVDBProvider not initialized');
    const cleanId = seriesId.replace('tvdb_', '');
    
    const seriesData = await this.client.getSeriesExtended(cleanId);
    if (seriesData && seriesData.episodes) {
      const episodes = seriesData.episodes.filter((e: any) => e.seasonNumber === seasonNumber);
      return episodes.map((e: any) => TVDBMapper.mapEpisode(e, cleanId));
    }
    
    const defaultEpisodes = await this.client.getEpisodesBySeason(cleanId, 'default');
    if (defaultEpisodes && defaultEpisodes.episodes) {
      const episodes = defaultEpisodes.episodes.filter((e: any) => e.seasonNumber === seasonNumber);
      return episodes.map((e: any) => TVDBMapper.mapEpisode(e, cleanId));
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

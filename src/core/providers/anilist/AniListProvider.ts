import { IMetadataProvider, ProviderCapabilities, ProviderHealth, ProviderStatus, ProviderContext } from '../types';
import { Movie, Series, Episode, Anime } from '../../models/DomainModels';
import { AniListClient } from './AniListClient';
import { AniListMapper } from './AniListMapper';

export class AniListProvider implements IMetadataProvider {
  public readonly id = 'anilist';
  public readonly name = 'AniList';
  public readonly version = '1.0.0';
  public readonly priority = 2;
  public readonly enabled = true;
  public readonly status = ProviderStatus.READY;
  public readonly capabilities: ProviderCapabilities = {
    "supportsMetadata": true
};
  
  
  private client: AniListClient | null = null;
  private isInitialized = false;

  public async initialize(context: ProviderContext): Promise<void> {
    this.client = new AniListClient(context.network, context.cache, context.logger);
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
    if (!this.client) throw new Error('AniListProvider not initialized');
    const cleanId = id.replace('anilist_', '');
    const data = await this.client.getAnimeById(Number(cleanId));
    if (data && data.format === 'MOVIE') {
      const anime = AniListMapper.mapAnime(data);
      return {
        id: anime.id,
        title: anime.englishTitle || anime.romajiTitle,
        originalTitle: anime.nativeTitle,
        overview: anime.overview,
        releaseDate: anime.seasonYear ? String(anime.seasonYear) : undefined,
        genres: anime.genres,
        images: [],
        artwork: anime.artwork,
        videos: [],
        externalIds: anime.externalIds,
        ratings: anime.ratings,
        studios: anime.studios
      };
    }
    return null;
  }

  public async getSeries(id: string): Promise<Series | null> {
    if (!this.client) throw new Error('AniListProvider not initialized');
    const cleanId = id.replace('anilist_', '');
    const data = await this.client.getAnimeById(Number(cleanId));
    if (data && data.format !== 'MOVIE') {
      const anime = AniListMapper.mapAnime(data);
      return {
        id: anime.id,
        title: anime.englishTitle || anime.romajiTitle,
        originalTitle: anime.nativeTitle,
        overview: anime.overview,
        firstAirDate: anime.seasonYear ? String(anime.seasonYear) : undefined,
        status: anime.status,
        genres: anime.genres,
        images: [],
        artwork: anime.artwork,
        videos: [],
        externalIds: anime.externalIds,
        ratings: anime.ratings,
        seasonsCount: 1, 
        episodesCount: anime.episodes || 0
      };
    }
    return null;
  }

  public async getEpisodes(seriesId: string, seasonNumber: number): Promise<Episode[] | null> {
    return null; 
  }

  public async getAnime(id: string): Promise<Anime | null> {
    if (!this.client) throw new Error('AniListProvider not initialized');
    const cleanId = id.replace('anilist_', '');
    const data = await this.client.getAnimeById(Number(cleanId));
    if (data) {
      return AniListMapper.mapAnime(data);
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

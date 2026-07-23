import { IMetadataProvider, IArtworkProvider, ISearchProvider, ProviderContext, ProviderCapabilities, ProviderHealth, ProviderStatus } from '../types';
import { TMDBClient } from './TMDBClient';
import { TMDBMapper } from './TMDBMapper';
import { Movie, Series, Episode } from '../../models/DomainModels';
import { SearchQuery, SearchResult, SearchResultItem } from '../../search/types';

export class TMDBProvider implements IMetadataProvider, IArtworkProvider, ISearchProvider {
  public readonly id = 'tmdb';
  public readonly name = 'The Movie Database';
  public readonly version = '3.0.0';
  public readonly priority = 2;
  public readonly enabled = true;
  public readonly status = ProviderStatus.READY;
  public readonly capabilities: ProviderCapabilities = {
    "supportsMetadata": true,
    "supportsArtwork": true,
    "supportsSearch": true
};
  

  private client!: TMDBClient;
  private mapper!: TMDBMapper;
  private context!: ProviderContext;

  public async initialize(context: ProviderContext): Promise<void> {
    this.context = context;
    this.client = new TMDBClient(context.network, context.settingsManager);
    this.mapper = new TMDBMapper(context.config);
  }

  public async shutdown(): Promise<void> {
    // Nothing to clean up
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
    // Nothing to reset
  }

  // --- IMetadataProvider ---

  public async getMovie(id: string): Promise<Movie | null> {
    try {
      const cleanId = id.replace(/^tmdb_/, '').replace(/^ind_/, '');
      const data = await this.client.get<any>(`/movie/${cleanId}`, {
        append_to_response: 'videos,credits'
      });
      return this.mapper.mapMovie(data) as Movie; // Validation happens in MetadataManager
    } catch (err: any) {
      if (err.message && (err.message.includes('404') || err.message.includes('not configured') || err.message.includes('Authentication'))) return null;
      throw this.mapError(err);
    }
  }

  public async getSeries(id: string): Promise<Series | null> {
    try {
      const cleanId = id.replace(/^tmdb_/, '').replace(/^ind_/, '');
      const data = await this.client.get<any>(`/tv/${cleanId}`, {
        append_to_response: 'videos,credits'
      });
      return this.mapper.mapSeries(data) as Series;
    } catch (err: any) {
      if (err.message && (err.message.includes('404') || err.message.includes('not configured') || err.message.includes('Authentication'))) return null;
      throw this.mapError(err);
    }
  }

  public async getEpisodes(seriesId: string, seasonNumber: number): Promise<Episode[] | null> {
    try {
      const cleanId = seriesId.replace(/^tmdb_/, '').replace(/^ind_/, '');
      const data = await this.client.get<any>(`/tv/${cleanId}/season/${seasonNumber}`);
      if (!data.episodes) return [];
      return data.episodes.map((ep: any) => this.mapper.mapEpisode(seriesId, ep)) as Episode[];
    } catch (err: any) {
      if (err.message && (err.message.includes('404') || err.message.includes('not configured') || err.message.includes('Authentication'))) return null;
      throw this.mapError(err);
    }
  }

  // --- IArtworkProvider ---
  public async getArtwork(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<import('../../models/DomainModels').ArtworkSet | null> {
    const cleanId = mediaId.replace('tmdb_', '');
    if (type === 'movie') {
      const movie = await this.getMovie(cleanId);
      return movie?.artwork || null;
    } else {
      const series = await this.getSeries(cleanId);
      return series?.artwork || null;
    }
  }

  // --- ISearchProvider ---
  public async search(query: SearchQuery): Promise<SearchResult> {
    try {
      const data = await this.client.get<any>('/search/multi', {
        query: query.query,
        page: query.page || 1,
        include_adult: query.includeAdult ? 'true' : 'false',
        language: query.language || 'en-US'
      });
      
      const items: SearchResultItem[] = data.results.map((item: any) => {
        if (item.media_type === 'movie') {
          return this.mapper.mapMovie(item);
        } else if (item.media_type === 'tv') {
          return this.mapper.mapSeries(item);
        }
        return null;
      }).filter(Boolean) as SearchResultItem[];

      return {
        query: query.query,
        items,
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results
      };
    } catch (err: any) {
      throw this.mapError(err);
    }
  }

  // --- Error Mapping ---
  private mapError(err: any): Error {
    // TMDBClient already throws basic normalized errors ('Timeout', 'Authentication', 'RateLimit')
    // We can just pass them through, ProviderManager expects these specific messages to set ProviderErrorType
    return err;
  }
}

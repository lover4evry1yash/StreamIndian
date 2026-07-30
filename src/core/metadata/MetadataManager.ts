import { ProviderManager, ProviderCapability, IMetadataProvider } from '../providers';
import { MetadataAggregator } from './MetadataAggregator';
import { EventBus } from '../EventBus';
import { Logger } from '../Logger';
import { MetadataRepository } from './MetadataRepository';
import { ValidationLayer } from './ValidationLayer';
import { Movie, Series, Season, Episode, Collection, Person, CatalogCollectionRequest } from '../models/DomainModels';
import { MetadataEventType } from './events';

export class MetadataManager {
  private aggregator: MetadataAggregator;
  private repository: MetadataRepository;
  private eventBus: EventBus;
  private logger: Logger;
  private inFlightRequests = new Map<string, Promise<any>>();

  private deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<T>;
    }
    const promise = fetcher().finally(() => {
      this.inFlightRequests.delete(key);
    });
    this.inFlightRequests.set(key, promise);
    return promise;
  }

  constructor(
    aggregator: MetadataAggregator, 
    repository: MetadataRepository, 
    eventBus: EventBus, 
    logger: Logger
  ) {
    this.aggregator = aggregator;

    this.repository = repository;
    this.eventBus = eventBus;
    this.logger = logger;
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number = 10000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Metadata request timed out after ${ms}ms`));
      }, ms);
      promise.then(
        (res) => {
          clearTimeout(timeoutId);
          resolve(res);
        },
        (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      );
    });
  }

  public async getMovie(id: string, forceRefresh: boolean = false): Promise<Movie | null> {
    let cached: Movie | null = null;
    if (!forceRefresh) {
      cached = await this.repository.getMovie(id);
      if (cached) {
         // Fire off a background refresh (Stale-While-Revalidate)
         this.refreshMovieInBackground(id).catch(e => this.logger.warn(`Background refresh failed for movie ${id}`, e));
         return cached;
      }
    }

    try {
      const result = await this.deduplicate(`movie:${id}`, () => this.withTimeout(this.aggregator.getMovie(id), 10000));

      if (result) {
        const validated = ValidationLayer.validateMovie(result);
        await this.repository.saveMovie(id, validated);
        this.eventBus.emit(MetadataEventType.LOADED, { type: 'movie', id, data: validated });
        return validated;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch metadata for movie ${id}`, error);
      this.eventBus.emit(MetadataEventType.ERROR, { type: 'movie', id, error });
    }

    return null;
  }

  private async refreshMovieInBackground(id: string): Promise<void> {
     try {
       const result = await this.deduplicate(`movie:${id}`, () => this.withTimeout(this.aggregator.getMovie(id), 15000));
       if (result) {
          const validated = ValidationLayer.validateMovie(result);
          await this.repository.saveMovie(id, validated);
          this.eventBus.emit(MetadataEventType.UPDATED, { type: 'movie', id, data: validated });
       }
     } catch(e) {
       // Ignore background errors
     }
  }

  public async getSeries(id: string, forceRefresh: boolean = false): Promise<Series | null> {
    let cached: Series | null = null;
    if (!forceRefresh) {
      cached = await this.repository.getSeries(id);
      if (cached) {
         this.refreshSeriesInBackground(id).catch(e => this.logger.warn(`Background refresh failed for series ${id}`, e));
         return cached;
      }
    }

    try {
      const result = await this.deduplicate(`series:${id}`, () => this.withTimeout(this.aggregator.getSeries(id), 10000));

      if (result) {
        const validated = ValidationLayer.validateSeries(result);
        await this.repository.saveSeries(id, validated);
        this.eventBus.emit(MetadataEventType.LOADED, { type: 'series', id, data: validated });
        return validated;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch metadata for series ${id}`, error);
      this.eventBus.emit(MetadataEventType.ERROR, { type: 'series', id, error });
    }

    return null;
  }

  private async refreshSeriesInBackground(id: string): Promise<void> {
     try {
       const result = await this.deduplicate(`series:${id}`, () => this.withTimeout(this.aggregator.getSeries(id), 15000));
       if (result) {
          const validated = ValidationLayer.validateSeries(result);
          await this.repository.saveSeries(id, validated);
          this.eventBus.emit(MetadataEventType.UPDATED, { type: 'series', id, data: validated });
       }
     } catch(e) {
       // Ignore background errors
     }
  }

  public async getEpisodes(seriesId: string, seasonNumber: number, forceRefresh: boolean = false): Promise<Episode[] | null> {
    if (!forceRefresh) {
      const cached = await this.repository.getEpisodes(seriesId, seasonNumber);
      if (cached) return cached;
    }

    try {
      const result = await this.deduplicate(`episodes:${seriesId}:${seasonNumber}`, () => this.withTimeout(this.aggregator.getEpisodes(seriesId, seasonNumber), 10000));

      if (result && Array.isArray(result)) {
        const validated = result.map((e: any) => {
          try {
            return ValidationLayer.validateEpisode(e);
          } catch (err) {
            this.logger.warn(`Dropping malformed episode from series ${seriesId} season ${seasonNumber}`);
            return null;
          }
        }).filter(Boolean) as Episode[];
        
        await this.repository.saveEpisodes(seriesId, seasonNumber, validated);
        this.eventBus.emit(MetadataEventType.LOADED, { type: 'episode', id: `${seriesId}_${seasonNumber}`, data: validated });
        return validated;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch episodes for series ${seriesId} season ${seasonNumber}`, error);
      this.eventBus.emit(MetadataEventType.ERROR, { type: 'episode', id: `${seriesId}_${seasonNumber}`, error });
    }
    return null;
  }

  // Not strictly in IMetadataProvider right now, but required by milestone. 
  // Future providers will extend capabilities to provide these.
  public async getSeason(seriesId: string, seasonNumber: number, forceRefresh: boolean = false): Promise<Season | null> {
    if (!forceRefresh) {
      const cached = await this.repository.getSeason(seriesId, seasonNumber);
      if (cached) return cached;
    }
    // In a real scenario, ProviderManager would execute a getSeason capability
    return null; 
  }

  public async getCollection(id: string, forceRefresh: boolean = false): Promise<Collection | null> {
    if (!forceRefresh) {
      const cached = await this.repository.getCollection(id);
      if (cached) return cached;
    }
    return null;
  }

  public async getPerson(id: string, forceRefresh: boolean = false): Promise<Person | null> {
    if (!forceRefresh) {
      const cached = await this.repository.getPerson(id);
      if (cached) return cached;
    }
    return null;
  }

  
  public async getCatalogCollection(request: CatalogCollectionRequest): Promise<import('../models/DomainModels').MediaReference[]> {
    const options = { language: request.language, page: request.page };
    const langKey = request.language || 'global';
    const pageNum = request.page || 1;

    const cached = await this.repository.getCatalogCollection(request.type, request.mediaType, langKey, pageNum);
    if (cached) {
      return cached;
    }

    let result: import('../models/DomainModels').MediaReference[] = [];
    switch (request.type) {
      case 'trending':
        result = await this.getTrending(request.mediaType as 'movie' | 'series', options);
        break;
      case 'popular':
        result = await this.getPopular(request.mediaType as 'movie' | 'series', options);
        break;
      case 'topRated':
        result = await this.getTopRated(request.mediaType as 'movie' | 'series', options);
        break;
      default:
        this.logger.warn(`Unsupported catalog collection type: ${request.type}`);
        return [];
    }

    if (result && result.length > 0) {
      await this.repository.saveCatalogCollection(request.type, request.mediaType, langKey, pageNum, result);
    }
    return result;
  }

  /**
   * @deprecated Use getCatalogCollection({ type: 'trending', mediaType: type }) instead.
   */
  public async getTrending(type: 'movie' | 'series', options?: { language?: string; page?: number }): Promise<import('../models/DomainModels').MediaReference[]> {
    return this.aggregator.getTrending(type, options);
  }

  /**
   * @deprecated Use getCatalogCollection({ type: 'popular', mediaType: type }) instead.
   */
  public async getPopular(type: 'movie' | 'series', options?: { language?: string; page?: number }): Promise<import('../models/DomainModels').MediaReference[]> {
    return this.aggregator.getPopular(type, options);
  }

  /**
   * @deprecated Use getCatalogCollection({ type: 'topRated', mediaType: type }) instead.
   */
  public async getTopRated(type: 'movie' | 'series', options?: { language?: string; page?: number }): Promise<import('../models/DomainModels').MediaReference[]> {
    return this.aggregator.getTopRated(type, options);
  }

  public async prefetch(type: 'movie' | 'series', id: string): Promise<void> {
    this.logger.info(`Prefetching ${type} ${id}`);
    
    // We execute these asynchronously and don't await the result to block the caller.
    // They populate the cache in the background.
    if (type === 'movie') {
      await this.getMovie(id).catch(() => {});
    } else {
      await this.getSeries(id).catch(() => {});
    }
    
    this.eventBus.emit(MetadataEventType.PREFETCHED, { type, id });
  }

  public async invalidate(type: 'movie' | 'series' | 'season' | 'episode' | 'person' | 'collection', id: string): Promise<void> {
    await this.repository.invalidate(type, id);
    this.eventBus.emit(MetadataEventType.INVALIDATED, { type, id });
  }
}

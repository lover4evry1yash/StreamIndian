import { CacheManager, CachePolicyType } from '../storage';
import { Movie, Series, Season, Episode, Collection, Person, Image } from '../models/DomainModels';

export class MetadataRepository {
  private cache: CacheManager;

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  public async getMovie(id: string): Promise<Movie | null> {
    return this.cache.get<Movie>('domain_movie', id, CachePolicyType.METADATA);
  }

  public async saveMovie(id: string, movie: Movie): Promise<void> {
    await this.cache.set('domain_movie', id, movie, CachePolicyType.METADATA);
  }

  public async getSeries(id: string): Promise<Series | null> {
    return this.cache.get<Series>('domain_series', id, CachePolicyType.METADATA);
  }

  public async saveSeries(id: string, series: Series): Promise<void> {
    await this.cache.set('domain_series', id, series, CachePolicyType.METADATA);
  }

  public async getSeason(seriesId: string, seasonNumber: number): Promise<Season | null> {
    return this.cache.get<Season>('domain_season', `${seriesId}_${seasonNumber}`, CachePolicyType.METADATA);
  }

  public async saveSeason(seriesId: string, seasonNumber: number, season: Season): Promise<void> {
    await this.cache.set('domain_season', `${seriesId}_${seasonNumber}`, season, CachePolicyType.METADATA);
  }

  public async getEpisodes(seriesId: string, seasonNumber: number): Promise<Episode[] | null> {
    return this.cache.get<Episode[]>('domain_episodes', `${seriesId}_${seasonNumber}`, CachePolicyType.METADATA);
  }

  public async saveEpisodes(seriesId: string, seasonNumber: number, episodes: Episode[]): Promise<void> {
    await this.cache.set('domain_episodes', `${seriesId}_${seasonNumber}`, episodes, CachePolicyType.METADATA);
  }

  public async getPerson(id: string): Promise<Person | null> {
    return this.cache.get<Person>('domain_person', id, CachePolicyType.METADATA);
  }

  public async savePerson(id: string, person: Person): Promise<void> {
    await this.cache.set('domain_person', id, person, CachePolicyType.METADATA);
  }

  public async getCollection(id: string): Promise<Collection | null> {
    return this.cache.get<Collection>('domain_collection', id, CachePolicyType.METADATA);
  }

  public async saveCollection(id: string, collection: Collection): Promise<void> {
    await this.cache.set('domain_collection', id, collection, CachePolicyType.METADATA);
  }

  public async getCatalogCollection(type: string, mediaType: string, language: string = 'global', page: number = 1): Promise<any | null> {
    const cacheKey = `${type}_${mediaType}_${language}_page${page}`;
    return this.cache.get<any>('catalog_collection', cacheKey, CachePolicyType.METADATA);
  }

  public async saveCatalogCollection(type: string, mediaType: string, language: string = 'global', page: number = 1, data: any): Promise<void> {
    const cacheKey = `${type}_${mediaType}_${language}_page${page}`;
    await this.cache.set('catalog_collection', cacheKey, data, CachePolicyType.METADATA);
  }

  public async invalidate(type: string, id: string): Promise<void> {
    await this.cache.invalidate(`domain_${type}`, id);
  }
}

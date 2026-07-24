import { MetadataManager } from '../metadata/MetadataManager';
import { Logger } from '../Logger';
import { Movie, Series, Season, Episode } from '../models/DomainModels';

export class DetailService {
  private metadataManager: MetadataManager;
  private logger: Logger;

  constructor(metadataManager: MetadataManager, logger: Logger) {
    this.metadataManager = metadataManager;
    this.logger = logger;
  }

  public async getMovieDetails(id: string): Promise<Movie | null> {
    this.logger.info(`DetailService: Fetching movie details for id: ${id}`);
    try {
      return await this.metadataManager.getMovie(id);
    } catch (error) {
      this.logger.error(`Error fetching movie details for ${id}`, error);
      return null;
    }
  }

  public async getSeriesDetails(id: string): Promise<Series | null> {
    this.logger.info(`DetailService: Fetching series details for id: ${id}`);
    try {
      return await this.metadataManager.getSeries(id);
    } catch (error) {
      this.logger.error(`Error fetching series details for ${id}`, error);
      return null;
    }
  }
  
  public async getAnimeDetails(id: string): Promise<Series | null> {
    this.logger.info(`DetailService: Fetching anime details for id: ${id}`);
    try {
      if ((this.metadataManager as any).getAnime) {
        return await (this.metadataManager as any).getAnime(id);
      } else {
        return await this.metadataManager.getSeries(id);
      }
    } catch (error) {
      this.logger.error(`Error fetching anime details for ${id}`, error);
      return null;
    }
  }

  public async getSeason(seriesId: string, seasonNumber: number): Promise<Season | null> {
    this.logger.info(`DetailService: Fetching season ${seasonNumber} for series id: ${seriesId}`);
    try {
      return await this.metadataManager.getSeason(seriesId, seasonNumber);
    } catch (error) {
      this.logger.error(`Error fetching season ${seasonNumber} for series ${seriesId}`, error);
      return null;
    }
  }

  public async getEpisodes(seriesId: string, seasonNumber: number): Promise<Episode[]> {
    this.logger.info(`DetailService: Fetching episodes for season ${seasonNumber} of series id: ${seriesId}`);
    try {
      const episodes = await this.metadataManager.getEpisodes(seriesId, seasonNumber);
      return episodes || [];
    } catch (error) {
      this.logger.error(`Error fetching episodes for season ${seasonNumber} of series ${seriesId}`, error);
      return [];
    }
  }
}

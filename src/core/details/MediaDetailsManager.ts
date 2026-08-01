import { EventBus } from '../EventBus';
import { Logger } from '../Logger';
import { DetailService } from '../services/DetailService';
import { MediaDetailsRepository } from './MediaDetailsRepository';
import { MediaSectionBuilder } from './MediaSectionBuilder';
import { MediaActionResolver } from './MediaActionResolver';
import { MediaDetails, MediaType } from './types';
import { MediaDetailsEventType } from './events';

export class MediaDetailsManager {
  private detailService: DetailService;
  private repository: MediaDetailsRepository;
  private sectionBuilder: MediaSectionBuilder;
  private actionResolver: MediaActionResolver;
  private eventBus: EventBus;
  private logger: Logger;

  constructor(
    detailService: DetailService,
    repository: MediaDetailsRepository,
    sectionBuilder: MediaSectionBuilder,
    actionResolver: MediaActionResolver,
    eventBus: EventBus,
    logger: Logger
  ) {
    this.detailService = detailService;
    this.repository = repository;
    this.sectionBuilder = sectionBuilder;
    this.actionResolver = actionResolver;
    this.eventBus = eventBus;
    this.logger = logger;
  }

  public async loadDetails(type: MediaType, id: string): Promise<void> {
    this.eventBus.emit(MediaDetailsEventType.DETAILS_LOADING, { mediaId: id, mediaType: type });
    
    try {
      let data: any;
      if (type === 'movie') {
        data = await this.detailService.getMovieDetails(id);
      } else if (type === 'series') {
        data = await this.detailService.getSeriesDetails(id);
      } else if (type === 'anime') {
        data = await this.detailService.getAnimeDetails(id);
      }

      if (!data) {
        throw new Error(`Failed to load ${type} with id ${id}`);
      }

      const details: MediaDetails = {
        type,
        data,
      };

      // Load initial season/episodes if series/anime
      if (type === 'series' || type === 'anime') {
        // Usually default to season 1, or continue watching season
        const seasonNumber = 1; 
        const episodes = await this.detailService.getEpisodes(id, seasonNumber);
        if (episodes && episodes.length > 0) {
          details.activeSeason = { id: `${id}_s${seasonNumber}`, seriesId: id, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: episodes.length, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
          details.activeEpisodes = episodes;
        } else {
          details.activeSeason = { id: `${id}_s${seasonNumber}`, seriesId: id, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: 0, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
          details.activeEpisodes = [];
        }
      }

      this.repository.setActiveDetails(id, details);
      this.eventBus.emit(MediaDetailsEventType.DETAILS_READY, { mediaId: id, mediaType: type, data: details });

    } catch (error) {
      this.logger.error(`MediaDetailsManager failed to load ${type} ${id}`, error);
      this.eventBus.emit(MediaDetailsEventType.DETAILS_FAILED, { mediaId: id, mediaType: type, error });
    }
  }

  public async changeSeason(seriesId: string, seasonNumber: number): Promise<void> {
    const details = this.repository.getActiveDetails(seriesId);
    if (!details) return;

    this.eventBus.emit(MediaDetailsEventType.SEASON_CHANGED, { seriesId, seasonNumber });

    try {
      const episodes = await this.detailService.getEpisodes(seriesId, seasonNumber);
      if (episodes && episodes.length > 0) {
        details.activeSeason = { id: `${seriesId}_s${seasonNumber}`, seriesId, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: episodes.length, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
        details.activeEpisodes = episodes;
        this.repository.setActiveDetails(seriesId, details);
        this.eventBus.emit(MediaDetailsEventType.DETAILS_UPDATED, { mediaId: seriesId, mediaType: details.type, data: details });
      } else {
        details.activeSeason = { id: `${seriesId}_s${seasonNumber}`, seriesId, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: 0, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
        details.activeEpisodes = [];
        this.repository.setActiveDetails(seriesId, details);
        this.eventBus.emit(MediaDetailsEventType.DETAILS_UPDATED, { mediaId: seriesId, mediaType: details.type, data: details });
      }
    } catch (error) {
      this.logger.error(`MediaDetailsManager failed to load season ${seasonNumber} for ${seriesId}`, error);
    }
  }

  public getSectionBuilder(): MediaSectionBuilder {
    return this.sectionBuilder;
  }

  public getActionResolver(): MediaActionResolver {
    return this.actionResolver;
  }
}

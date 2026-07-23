import { EventBus } from '../EventBus';
import { Logger } from '../Logger';
import { MetadataManager } from '../metadata/MetadataManager';
import { MediaDetailsRepository } from './MediaDetailsRepository';
import { MediaSectionBuilder } from './MediaSectionBuilder';
import { MediaActionResolver } from './MediaActionResolver';
import { MediaDetails, MediaType } from './types';
import { MediaDetailsEventType } from './events';

export class MediaDetailsManager {
  private metadataManager: MetadataManager;
  private repository: MediaDetailsRepository;
  private sectionBuilder: MediaSectionBuilder;
  private actionResolver: MediaActionResolver;
  private eventBus: EventBus;
  private logger: Logger;

  constructor(
    metadataManager: MetadataManager,
    repository: MediaDetailsRepository,
    sectionBuilder: MediaSectionBuilder,
    actionResolver: MediaActionResolver,
    eventBus: EventBus,
    logger: Logger
  ) {
    this.metadataManager = metadataManager;
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
        data = await this.metadataManager.getMovie(id);
      } else if (type === 'series') {
        data = await this.metadataManager.getSeries(id);
      } else if (type === 'anime') {
        // Anime support would call getAnime, which could fallback to TMDB for now or Anilist later
        // Assuming we have getAnime in metadataManager, or we treat anime as series temporarily
        if ((this.metadataManager as any).getAnime) {
          data = await (this.metadataManager as any).getAnime(id);
        } else {
          data = await this.metadataManager.getSeries(id);
        }
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
        const episodes = await this.metadataManager.getEpisodes(id, seasonNumber);
        if (episodes && episodes.length > 0) {
          details.activeSeason = { id: `${id}_s${seasonNumber}`, seriesId: id, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: episodes.length, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
          details.activeEpisodes = episodes;
        } else {
          details.activeSeason = { id: `${id}_s${seasonNumber}`, seriesId: id, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: 1, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
          details.activeEpisodes = [{ id: `${id}_s${seasonNumber}_e1`, seriesId: id, seasonNumber, episodeNumber: 1, title: 'Episode 1 (Placeholder)', overview: 'Episode data unavailable.', durationMinutes: 45, images: [], artwork: {} }];
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
      const episodes = await this.metadataManager.getEpisodes(seriesId, seasonNumber);
      if (episodes && episodes.length > 0) {
        details.activeSeason = { id: `${seriesId}_s${seasonNumber}`, seriesId, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: episodes.length, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
        details.activeEpisodes = episodes;
        this.repository.setActiveDetails(seriesId, details);
        this.eventBus.emit(MediaDetailsEventType.DETAILS_UPDATED, { mediaId: seriesId, mediaType: details.type, data: details });
      } else {
        details.activeSeason = { id: `${seriesId}_s${seasonNumber}`, seriesId, seasonNumber, title: `Season ${seasonNumber}`, episodesCount: 1, overview: '', images: [], artwork: { posters: [], backdrops: [], banners: [], landscapes: [], thumbs: [], logos: [], clearLogos: [], clearArts: [], discArts: [], characterArts: [] } };
        details.activeEpisodes = [{ id: `${seriesId}_s${seasonNumber}_e1`, seriesId, seasonNumber, episodeNumber: 1, title: 'Episode 1 (Placeholder)', overview: 'Episode data unavailable.', durationMinutes: 45, images: [], artwork: {} }];
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

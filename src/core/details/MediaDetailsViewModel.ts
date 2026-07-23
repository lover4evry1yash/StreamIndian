import { MediaDetailsManager } from './MediaDetailsManager';
import { MediaDetailsRepository } from './MediaDetailsRepository';
import { MediaSection, MediaAction } from './types';
import { ArtworkSelector } from '../metadata/ArtworkSelector';
import { Image } from '../models/DomainModels';

export class MediaDetailsViewModel {
  private manager: MediaDetailsManager;
  private repository: MediaDetailsRepository;
  private artworkSelector: ArtworkSelector;

  constructor(
    manager: MediaDetailsManager, 
    repository: MediaDetailsRepository,
    artworkSelector: ArtworkSelector
  ) {
    this.manager = manager;
    this.repository = repository;
    this.artworkSelector = artworkSelector;
  }

  public getSections(id: string): MediaSection[] {
    const details = this.repository.getActiveDetails(id);
    if (!details) return [];
    return this.manager.getSectionBuilder().buildSections(details);
  }

  public getActions(id: string): MediaAction[] {
    const details = this.repository.getActiveDetails(id);
    if (!details) return [];
    return this.manager.getActionResolver().resolveActions(details);
  }

  public getHeaderArtwork(id: string): { poster?: Image, backdrop?: Image, logo?: Image } {
    const details = this.repository.getActiveDetails(id);
    if (!details || !details.data.artwork) return {};

    const artwork = details.data.artwork;
    return {
      poster: this.artworkSelector.selectBestPoster(artwork) || undefined,
      backdrop: this.artworkSelector.selectBestBackdrop(artwork) || undefined,
      logo: this.artworkSelector.selectBestLogo(artwork) || undefined
    };
  }

  public formatRuntime(minutes?: number): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  public formatReleaseYear(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).getFullYear().toString();
  }
}

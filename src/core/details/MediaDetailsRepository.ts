import { MetadataRepository } from '../metadata';
import { MediaDetails, MediaType } from './types';

export class MediaDetailsRepository {
  private metadataRepo: MetadataRepository;
  private activeDetails: Map<string, MediaDetails> = new Map();

  constructor(metadataRepo: MetadataRepository) {
    this.metadataRepo = metadataRepo;
  }

  public getActiveDetails(id: string): MediaDetails | null {
    return this.activeDetails.get(id) || null;
  }

  public setActiveDetails(id: string, details: MediaDetails): void {
    this.activeDetails.set(id, details);
  }

  public clearActiveDetails(id: string): void {
    this.activeDetails.delete(id);
  }
}

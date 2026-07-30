import { ExternalIdRegistry } from '../providers/ExternalIdRegistry';
import { ExternalIds } from '../models/DomainModels';

export class IdMapperService {
  private registry: ExternalIdRegistry;

  constructor(registry: ExternalIdRegistry) {
    this.registry = registry;
  }

  public async getExternalIds(primaryId: string, primaryType: 'tmdb' | 'imdb' | 'tvdb'): Promise<ExternalIds> {
    // In a real implementation, this would call a TMDB /find API or similar if the ID is not TMDB.
    // For now, we assume the primaryId is a TMDB ID since our catalog providers primarily use TMDB.
    const ids: ExternalIds = {};
    if (primaryType === 'tmdb') {
      ids.tmdbId = primaryId;
    } else if (primaryType === 'imdb') {
      ids.imdbId = primaryId;
    } else if (primaryType === 'tvdb') {
      ids.tvdbId = primaryId;
    }
    return ids;
  }
}

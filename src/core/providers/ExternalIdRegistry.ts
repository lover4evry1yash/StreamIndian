import { ExternalIds } from '../models/DomainModels';

export class ExternalIdRegistry {
  // Matches provider identifiers across services
  public resolveToTMDB(externalIds: ExternalIds): string | null {
    if (externalIds.tmdbId) return externalIds.tmdbId;
    return null;
  }

  public resolveToTVDB(externalIds: ExternalIds): string | null {
    if (externalIds.tvdbId) return externalIds.tvdbId;
    return null;
  }

  public resolveToAniList(externalIds: ExternalIds): string | null {
    if (externalIds.anilistId) return externalIds.anilistId;
    return null;
  }
}

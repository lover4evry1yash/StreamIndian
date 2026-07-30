import { CanonicalStreamSource, MediaSearchQuery } from '../types';
import { SourceManager } from '../sources/SourceManager';

export class StreamDiscoveryService {
  private sourceManager: SourceManager;

  constructor(sourceManager: SourceManager) {
    this.sourceManager = sourceManager;
  }

  public async discover(query: MediaSearchQuery): Promise<CanonicalStreamSource[]> {
    console.log('[StreamDiscoveryService] buildSearchQuery mapping: ', {
        originalId: query.mediaId,
        mediaType: query.type,
        tmdbId: query.tmdbId,
        imdbId: query.imdbId,
        season: query.season,
        episode: query.episode
    });

    const results = await this.sourceManager.search(query);
    console.log(`[StreamDiscoveryService] Discovered ${results.length} canonical sources`);
    return results;
  }
}

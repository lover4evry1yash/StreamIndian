import { MediaItem } from '../../../types/tizen';
import { CanonicalStreamSource, MediaSearchQuery } from '../types';
import { SourceManager } from '../sources/SourceManager';

export class StreamDiscoveryService {
  private sourceManager: SourceManager;

  constructor(sourceManager: SourceManager) {
    this.sourceManager = sourceManager;
  }

  public async discover(media: MediaItem): Promise<CanonicalStreamSource[]> {
    const query = this.buildSearchQuery(media);
    return await this.sourceManager.search(query);
  }

  private buildSearchQuery(media: MediaItem): MediaSearchQuery {
    const m: any = media;
    const mediaType = m.mediaType || (m.seasonNumber ? 'episode' : 'movie');
    const tmdbId = m.externalIds?.tmdbId || (m.id.startsWith('tmdb_') ? m.id.split('_')[1] : m.id);
    const imdbId = m.externalIds?.imdbId;
    const year = m.year || (m.releaseDate ? parseInt(m.releaseDate.substring(0, 4)) : undefined) || (m.firstAirDate ? parseInt(m.firstAirDate.substring(0, 4)) : undefined);
    
    let queryType: 'movie' | 'episode' = 'movie';
    let season = undefined;
    let episode = undefined;
    
    if (mediaType === 'series' || mediaType === 'episode') {
       queryType = 'episode';
       season = m.seasonNumber || 1;
       episode = m.episodeNumber || 1;
    }

    return {
      mediaId: m.id,
      type: queryType,
      title: m.title,
      year: year,
      season: season,
      episode: episode,
      tmdbId: tmdbId,
      imdbId: imdbId
    };
  }
}

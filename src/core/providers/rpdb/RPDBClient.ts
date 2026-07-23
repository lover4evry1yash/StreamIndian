import { Logger } from '../../Logger';

const RPDB_API_KEY = 'YOUR_RPDB_API_KEY';

export class RPDBClient {
  private logger: Logger;

  public metrics = {
    requests: 0,
    rateLimitsHit: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalLatencyMs: 0
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  // RPDB mostly constructs URLs, but we can verify it exists if we want to via API.
  // For now, we will construct the deterministic URLs.
  public getMoviePosterUrl(tmdbId: string, language: string = 'en'): string {
    return `https://api.ratingposterdb.com/${RPDB_API_KEY}/tmdb/poster-default/movie-${tmdbId}.jpg?lang=${language}`;
  }

  public getSeriesPosterUrl(tvdbId: string, language: string = 'en'): string {
    // RPDB supports tvdb and tmdb for shows. Let's assume tvdb.
    return `https://api.ratingposterdb.com/${RPDB_API_KEY}/tvdb/poster-default/show-${tvdbId}.jpg?lang=${language}`;
  }
}

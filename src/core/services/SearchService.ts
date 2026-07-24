import { SearchManager, SearchHistoryItem } from '../search';
import { Logger } from '../Logger';
import { MediaItem } from '../../types/tizen';

export class SearchService {
  private searchManager: SearchManager;
  private logger: Logger;

  constructor(searchManager: SearchManager, logger: Logger) {
    this.searchManager = searchManager;
    this.logger = logger;
  }

  public async search(query: string, language: string, page: number = 1): Promise<MediaItem[]> {
    this.logger.info(`SearchService executing search for: ${query}`);
    
    try {
      const result = await this.searchManager.search({
        query,
        language: language === 'All' ? undefined : language,
        page
      });

      if (!result) return [];

      return result.items.map((item: any) => {
        const isMovie = item.durationMinutes !== undefined;
        return {
          id: item.id,
          mediaType: item.mediaType || (isMovie ? 'movie' : 'series'),
          title: item.title,
          originalTitle: item.originalTitle,
          language: language === 'All' ? 'Hindi' : language as any, // fallback
          year: item.releaseDate ? parseInt(item.releaseDate.substring(0, 4)) : (item.firstAirDate ? parseInt(item.firstAirDate.substring(0, 4)) : 2024),
          durationMinutes: item.durationMinutes || 120,
          rating: item.ratings?.[0]?.score ? `${item.ratings[0].score}/10` : 'U/A 13+',
          imdbRating: item.ratings?.[0]?.score,
          genres: item.genres?.map((g: any) => g.name) || [],
          posterUrl: item.artwork?.posters?.[0]?.url || '',
          backdropUrl: item.artwork?.backdrops?.[0]?.url || '',
          description: item.overview || '',
          cast: item.credits?.cast?.slice(0, 3).map((c: any) => c.name) || [],
          director: item.credits?.crew?.find((c: any) => c.role === 'Director')?.name || 'Unknown',
          provider: 'TMDB',
          streams: []
        };
      });
    } catch (error) {
      this.logger.error("SearchService search failed", error);
      throw error;
    }
  }

  public async getHistory(): Promise<SearchHistoryItem[]> {
    return this.searchManager.getHistory();
  }

  public async clearHistory(): Promise<void> {
    return this.searchManager.clearHistory();
  }
}

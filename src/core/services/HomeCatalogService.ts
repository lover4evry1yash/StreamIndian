import { MediaItem } from '../../types/tizen';
import { MetadataManager } from '../metadata/MetadataManager';
import { Logger } from '../Logger';
import { MediaReference, Movie, Series } from '../models/DomainModels';
import { container } from '../../core/ServiceContainer';
import { MetadataRepository } from '../metadata/MetadataRepository';

export class HomeCatalogService {
  private metadataManager: MetadataManager;
  private logger: Logger;

  constructor(metadataManager: MetadataManager, logger: Logger) {
    this.metadataManager = metadataManager;
    this.logger = logger;
  }

  private mapLanguageToIso(lang: string): string | undefined {
    const map: Record<string, string> = {
      'English': 'en',
      'Hindi': 'hi',
      'Tamil': 'ta',
      'Telugu': 'te',
      'Malayalam': 'ml',
      'Kannada': 'kn',
      'Bengali': 'bn',
      'Marathi': 'mr',
      'Punjabi': 'pa',
      'Gujarati': 'gu'
    };
    return map[lang];
  }

  public async getUnifiedCatalog(languageFilter?: string, query?: string): Promise<MediaItem[]> {
    this.logger.info(`Fetching unified catalog via MetadataManager (language: ${languageFilter})`);
    
    try {
      const items: MediaItem[] = [];
      
      const fetchCatalog = async (type: string, mediaType: 'movie' | 'series', language?: string, isTrending: boolean = false) => {
          const res = await this.metadataManager.getCatalogCollection({ type, mediaType, language });
          this.mapToMediaItems(res, mediaType, items, isTrending);
      };

      if (languageFilter && languageFilter !== 'All') {
          const isoLang = this.mapLanguageToIso(languageFilter);
          await Promise.all([
             fetchCatalog('trending', 'movie', isoLang, true),
             fetchCatalog('trending', 'series', isoLang, true),
             fetchCatalog('popular', 'movie', isoLang, false),
             fetchCatalog('popular', 'series', isoLang, false),
             fetchCatalog('topRated', 'movie', isoLang, false),
             fetchCatalog('topRated', 'series', isoLang, false)
          ]);
      } else {
          // Fetch Global
          await Promise.all([
             fetchCatalog('trending', 'movie', undefined, true),
             fetchCatalog('trending', 'series', undefined, true),
             fetchCatalog('popular', 'movie', undefined, false),
             fetchCatalog('popular', 'series', undefined, false),
             fetchCatalog('topRated', 'movie', undefined, false),
             fetchCatalog('topRated', 'series', undefined, false)
          ]);
          
          // Fetch Regional for shelves
          const regionalLangs = ['hi', 'ta', 'te', 'ml', 'kn', 'mr', 'bn', 'pa'];
          await Promise.all(regionalLangs.map(lang => fetchCatalog('popular', 'movie', lang, false)));
      }
      
      // Simple deduplication
      const deduplicatedMap = new Map<string, MediaItem>();
      items.forEach((item) => {
        const key = `${item.title.toLowerCase().trim()}_${item.year}_${item.language.toLowerCase()}`;
        if (!deduplicatedMap.has(key)) {
          deduplicatedMap.set(key, item);
        }
      });
      
      let results = Array.from(deduplicatedMap.values());
      
      
      
      // Enrich items with metadata concurrently
      let cacheHits = 0;
      let cacheMisses = 0;
      let metadataRequestsBefore = 0;
      let metadataRequestsAfter = 0;
      
      let repository: MetadataRepository | undefined;
      try {
        repository = container.resolve<MetadataRepository>('MetadataRepository');
      } catch (e) {
        this.logger.warn('Could not resolve MetadataRepository for cache optimization');
      }

      const CONCURRENCY_LIMIT = 5;
      for (let i = 0; i < results.length; i += CONCURRENCY_LIMIT) {
        const chunk = results.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(chunk.map(async (item) => {
          try {
            metadataRequestsBefore++;
            if (item.mediaType === 'movie') {
              let movie: Movie | null = null;
              if (repository) {
                movie = await repository.getMovie(item.id);
              }
              
              if (movie) {
                cacheHits++;
              } else {
                cacheMisses++;
                metadataRequestsAfter++;
                movie = await this.metadataManager.getMovie(item.id);
              }
              
              if (movie) {
                this.enrichMovieItem(item, movie);
              }
            } else if (item.mediaType === 'series') {
              let series: Series | null = null;
              if (repository) {
                series = await repository.getSeries(item.id);
              }
              
              if (series) {
                cacheHits++;
              } else {
                cacheMisses++;
                metadataRequestsAfter++;
                series = await this.metadataManager.getSeries(item.id);
              }
              
              if (series) {
                this.enrichSeriesItem(item, series);
              }
            }
          } catch (e) {
            this.logger.warn(`Failed to enrich metadata for ${item.id}`, e);
          }
        }));
      }
      
      const hitRate = metadataRequestsBefore > 0 ? (cacheHits / metadataRequestsBefore * 100).toFixed(1) : 0;
      const missRate = metadataRequestsBefore > 0 ? (cacheMisses / metadataRequestsBefore * 100).toFixed(1) : 0;
      this.logger.info(`Metadata Cache Stats: Hits: ${cacheHits} (${hitRate}%), Misses: ${cacheMisses} (${missRate}%), Requests Before: ${metadataRequestsBefore}, Requests After: ${metadataRequestsAfter}`);

      
      // Re-sort after metadata enrichment (to use imdbRating)
      results.sort((a, b) => {
        if (a.isTrending && !b.isTrending) return -1;
        if (!a.isTrending && b.isTrending) return 1;
        return (b.imdbRating || 0) - (a.imdbRating || 0);
      });
      
      return results;
    } catch (error) {
      this.logger.error('Error fetching catalog from MetadataManager in HomeCatalogService', error);
      return [];
    }
  }

  private mapLanguage(code?: string): string {
    if (!code) return 'English';
    const langMap: Record<string, string> = {
      'en': 'English',
      'hi': 'Hindi',
      'ta': 'Tamil',
      'te': 'Telugu',
      'ml': 'Malayalam',
      'kn': 'Kannada',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'pa': 'Punjabi',
      'gu': 'Gujarati'
    };
    return langMap[code] || 'English';
  }

  private mapToMediaItems(results: MediaReference[], mediaType: 'movie' | 'series', items: MediaItem[], isTrending: boolean) {
    if (!results || !Array.isArray(results)) return;
    
    for (const item of results) {
      if (!item.title) continue;
      
      const mediaItem: MediaItem = {
        id: item.id,
        mediaType: mediaType,
        title: item.title,
        originalTitle: item.title, // Domain model might not have originalTitle yet
        language: this.mapLanguage(item.language) as any,
        year: item.year || 0,
        durationMinutes: 0,
        rating: 'U/A 13+',
        imdbRating: 0,
        genres: [],
        posterUrl: item.posterUrl || '',
        backdropUrl: item.backdropUrl || '',
        description: '', // MediaReference doesn't have description
        cast: [],
        director: 'Unknown',
        provider: 'ProviderSystem',
        isTrending: isTrending,
        isRegionalHero: false,
        streams: [],
        externalIds: item.externalIds
      };
      
      items.push(mediaItem);
    }
  }


  private enrichMovieItem(item: MediaItem, movie: Movie) {
    if (movie.overview) item.description = movie.overview;
    if (movie.originalTitle) item.originalTitle = movie.originalTitle;
    if (movie.durationMinutes) item.durationMinutes = movie.durationMinutes;
    
    if (movie.genres && movie.genres.length > 0) {
      item.genres = movie.genres.map(g => g.name);
    }
    
    if (movie.ratings && movie.ratings.length > 0) {
      const imdb = movie.ratings.find(r => r.provider === 'imdb');
      const tmdb = movie.ratings.find(r => r.provider === 'tmdb');
      if (imdb) item.imdbRating = imdb.score;
      else if (tmdb) item.imdbRating = tmdb.score;
    }
    
    if (movie.certifications && movie.certifications.length > 0) {
      const inCert = movie.certifications.find(c => c.country === 'IN');
      if (inCert) item.rating = inCert.rating;
      else item.rating = movie.certifications[0].rating;
    }

    if (movie.credits) {
      if (movie.credits.cast && movie.credits.cast.length > 0) {
        item.cast = movie.credits.cast.slice(0, 5).map(c => c.name);
      }
      if (movie.credits.crew) {
        const director = movie.credits.crew.find(c => c.role === 'Director');
        if (director) item.director = director.name;
      }
    }
  }

  private enrichSeriesItem(item: MediaItem, series: Series) {
    if (series.overview) item.description = series.overview;
    if (series.originalTitle) item.originalTitle = series.originalTitle;
    
    if (series.genres && series.genres.length > 0) {
      item.genres = series.genres.map(g => g.name);
    }
    
    if (series.ratings && series.ratings.length > 0) {
      const imdb = series.ratings.find(r => r.provider === 'imdb');
      const tmdb = series.ratings.find(r => r.provider === 'tmdb');
      if (imdb) item.imdbRating = imdb.score;
      else if (tmdb) item.imdbRating = tmdb.score;
    }
    
    if (series.certifications && series.certifications.length > 0) {
      const inCert = series.certifications.find(c => c.country === 'IN');
      if (inCert) item.rating = inCert.rating;
      else item.rating = series.certifications[0].rating;
    }

    if (series.credits) {
      if (series.credits.cast && series.credits.cast.length > 0) {
        item.cast = series.credits.cast.slice(0, 5).map(c => c.name);
      }
      if (series.credits.crew) {
        const director = series.credits.crew.find(c => ['Director', 'Creator', 'Executive Producer'].includes(c.role));
        if (director) item.director = director.name;
      }
    }
  }

}
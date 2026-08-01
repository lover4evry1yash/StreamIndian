import { MediaItem, HistoryRecord } from '../../types/tizen';
import { StreamIndianStorage } from '../storage';
import { DetailService } from '../services/DetailService';

export class WatchlistViewModel {
  private listeners: Set<() => void> = new Set();
  
  private watchlist: MediaItem[] = [];
  private history: HistoryRecord[] = [];
  private isLoadingWatchlist: boolean = false;
  private isLoadingHistory: boolean = false;

  constructor(private detailService: DetailService) {}

  public getWatchlist(): MediaItem[] {
    return this.watchlist;
  }

  public getHistory(): HistoryRecord[] {
    return this.history;
  }

  public getIsLoadingWatchlist(): boolean {
    return this.isLoadingWatchlist;
  }

  public getIsLoadingHistory(): boolean {
    return this.isLoadingHistory;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public async loadData() {
    this.loadHistory();
    await this.loadWatchlist();
  }

  private loadHistory() {
    this.isLoadingHistory = true;
    this.notify();
    try {
      this.history = StreamIndianStorage.getHistory();
    } finally {
      this.isLoadingHistory = false;
      this.notify();
    }
  }

  public clearHistory() {
    localStorage.removeItem('streamindian_history_v1');
    this.history = [];
    this.notify();
  }

  private async loadWatchlist() {
    this.isLoadingWatchlist = true;
    this.notify();

    const watchlistIds = StreamIndianStorage.getWatchlist();
    const resolvedMedia: MediaItem[] = [];

    // Progressive loading with concurrency limit of 5
    const concurrency = 5;
    
    // We will process in chunks and notify progressively
    for (let i = 0; i < watchlistIds.length; i += concurrency) {
      const chunk = watchlistIds.slice(i, i + concurrency);
      
      const chunkResults = await Promise.all(chunk.map(async (id) => {
        return await this.resolveMediaItem(id);
      }));

      // Filter out nulls
      const validItems = chunkResults.filter((item): item is MediaItem => item !== null);
      resolvedMedia.push(...validItems);
      
      this.watchlist = [...resolvedMedia]; // create new array reference
      this.notify(); // Progressive update
    }

    this.isLoadingWatchlist = false;
    this.notify();
  }

  private async resolveMediaItem(id: string): Promise<MediaItem | null> {
    let details: any = await this.detailService.getMovieDetails(id);
    let mediaType: 'movie' | 'series' | 'anime' = 'movie';

    if (!details) {
      details = await this.detailService.getSeriesDetails(id);
      mediaType = 'series';
    }

    if (!details) {
      details = await this.detailService.getAnimeDetails(id);
      mediaType = 'anime';
    }

    if (!details) {
      return null;
    }

    return this.mapToMediaItem(details, mediaType);
  }

  private mapToMediaItem(details: any, mediaType: 'movie' | 'series' | 'anime'): MediaItem {
    const title = details.title || details.name || 'Unknown Title';
    const originalTitle = details.originalTitle || details.originalName || title;
    
    // Attempt to map language safely
    let lang = 'English';
    if (details.originalLanguage) {
      const map: Record<string, string> = {
        'en': 'English', 'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu',
        'ml': 'Malayalam', 'kn': 'Kannada', 'bn': 'Bengali', 'mr': 'Marathi',
        'pa': 'Punjabi', 'gu': 'Gujarati'
      };
      lang = map[details.originalLanguage] || 'English';
    } else if (details.language) {
      // If language string is provided on domain object directly
      const map: Record<string, string> = {
        'en': 'English', 'hi': 'Hindi', 'ta': 'Tamil', 'te': 'Telugu',
        'ml': 'Malayalam', 'kn': 'Kannada', 'bn': 'Bengali', 'mr': 'Marathi',
        'pa': 'Punjabi', 'gu': 'Gujarati'
      };
      lang = map[details.language] || details.language; // fallback to string
    }

    let year = 0;
    if (details.releaseDate) {
      year = parseInt(details.releaseDate.substring(0, 4)) || 0;
    } else if (details.firstAirDate) {
      year = parseInt(details.firstAirDate.substring(0, 4)) || 0;
    } else if (details.year) {
      year = details.year;
    }

    let rating = 'Unknown';
    if (details.certifications && details.certifications.length > 0) {
      const inCert = details.certifications.find((c: any) => c.country === 'IN');
      if (inCert) rating = inCert.rating;
      else rating = details.certifications[0].rating;
    }

    let imdbRating = 0;
    if (details.ratings && details.ratings.length > 0) {
      const imdb = details.ratings.find((r: any) => r.provider === 'imdb');
      const tmdb = details.ratings.find((r: any) => r.provider === 'tmdb');
      if (imdb) imdbRating = imdb.score;
      else if (tmdb) imdbRating = tmdb.score;
    }

    let genres = [];
    if (details.genres && details.genres.length > 0) {
      genres = details.genres.map((g: any) => g.name || g);
    }

    let posterUrl = '';
    let backdropUrl = '';
    
    if (details.artwork) {
      if (details.artwork.posters && details.artwork.posters.length > 0) posterUrl = details.artwork.posters[0].url;
      if (details.artwork.backdrops && details.artwork.backdrops.length > 0) backdropUrl = details.artwork.backdrops[0].url;
    } else if (details.posterUrl) {
      posterUrl = details.posterUrl;
      backdropUrl = details.backdropUrl || '';
    } else if (details.images && details.images.length > 0) {
       // legacy domain fallback
       posterUrl = details.images[0].url;
       backdropUrl = details.images[0].url;
    }

    let cast: string[] = [];
    let director = 'Unknown';
    
    if (details.credits) {
      if (details.credits.cast && details.credits.cast.length > 0) {
        cast = details.credits.cast.slice(0, 5).map((c: any) => c.name);
      }
      if (details.credits.crew) {
        const d = details.credits.crew.find((c: any) => c.role === 'Director');
        if (d) director = d.name;
      }
    }

    return {
      id: details.id,
      mediaType: mediaType,
      title: title,
      originalTitle: originalTitle,
      language: lang as any,
      year: year,
      durationMinutes: details.durationMinutes || details.runtime || 0,
      rating: rating,
      imdbRating: imdbRating,
      genres: genres,
      posterUrl: posterUrl,
      backdropUrl: backdropUrl,
      description: details.overview || details.description || '',
      cast: cast,
      director: director,
      provider: 'Unknown',
      streams: []
    };
  }
}

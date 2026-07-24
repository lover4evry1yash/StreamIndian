import { SearchService } from '../services/SearchService';
import { Logger } from '../Logger';
import { MediaItem } from '../../types/tizen';
import { SearchHistoryItem } from './types';

export class SearchViewModel {
  private searchService: SearchService;
  private logger: Logger;

  private query: string = '';
  private results: MediaItem[] = [];
  private history: SearchHistoryItem[] = [];
  private loading: boolean = false;
  private error: string | null = null;
  
  private debounceTimeout: any = null;
  private latestQueryId: number = 0;

  constructor(searchService: SearchService, logger: Logger) {
    this.searchService = searchService;
    this.logger = logger;
  }

  public async loadHistory(): Promise<void> {
    this.history = await this.searchService.getHistory();
  }

  public async clearHistory(): Promise<void> {
    await this.searchService.clearHistory();
    this.history = [];
  }

  public setQuery(query: string, language: string, onStateChange: () => void): void {
    this.query = query;
    if (query.trim().length === 0) {
      this.results = [];
      this.error = null;
      this.loading = false;
      if (this.debounceTimeout) {
         clearTimeout(this.debounceTimeout);
      }
      onStateChange();
      return;
    }

    this.loading = true;
    this.error = null;
    onStateChange();

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    const currentQueryId = ++this.latestQueryId;

    this.debounceTimeout = setTimeout(async () => {
      try {
        const results = await this.searchService.search(query, language);
        if (this.latestQueryId === currentQueryId) {
           this.results = results;
           this.loading = false;
           this.error = null;
           await this.loadHistory();
           onStateChange();
        }
      } catch (err: any) {
        if (this.latestQueryId === currentQueryId) {
           this.logger.error('SearchViewModel failed', err);
           this.error = err.message || 'Search failed';
           this.loading = false;
           this.results = [];
           onStateChange();
        }
      }
    }, 500); // 500ms debounce
  }

  public getQuery(): string { return this.query; }
  public getResults(): MediaItem[] { return this.results; }
  public getHistory(): SearchHistoryItem[] { return this.history; }
  public isLoading(): boolean { return this.loading; }
  public getError(): string | null { return this.error; }
}

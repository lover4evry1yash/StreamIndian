import { SearchHistoryItem } from './types';
import { CacheManager } from '../storage';

export interface ISearchRepository {
  getHistory(): Promise<SearchHistoryItem[]>;
  addHistory(query: string): Promise<void>;
  clearHistory(): Promise<void>;
}

export class SearchRepository implements ISearchRepository {
  private cache: CacheManager;
  private readonly HISTORY_KEY = 'search_history';
  private readonly MAX_HISTORY = 20;

  constructor(cache: CacheManager) {
    this.cache = cache;
  }

  public async getHistory(): Promise<SearchHistoryItem[]> {
    const history = await this.cache.get<SearchHistoryItem[]>('search', this.HISTORY_KEY);
    return history || [];
  }

  public async addHistory(query: string): Promise<void> {
    const history = await this.getHistory();
    const queryLower = query.toLowerCase().trim();
    
    // Remove if exists
    const filtered = history.filter(item => item.query.toLowerCase().trim() !== queryLower);
    
    // Add to top
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: Date.now()
    };
    
    filtered.unshift(newItem);
    
    // Trim to max
    const trimmed = filtered.slice(0, this.MAX_HISTORY);
    
    await this.cache.set('search', this.HISTORY_KEY, trimmed);
  }

  public async clearHistory(): Promise<void> {
    await this.cache.invalidate('search', this.HISTORY_KEY);
  }
}

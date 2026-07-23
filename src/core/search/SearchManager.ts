import { ProviderManager } from '../providers';
import { EventBus } from '../EventBus';
import { Logger } from '../Logger';
import { Config } from '../Config';
import { ISearchRepository } from './SearchRepository';
import { SearchQuery, SearchResult, SearchError, SearchErrorType, SearchEventType } from './types';
import { ISearchProvider, ProviderCapability } from '../providers/types';

export class SearchManager {
  private providerManager: ProviderManager;
  private repository: ISearchRepository;
  private eventBus: EventBus;
  private logger: Logger;
  private config: Config;

  private debounceTimeout: any = null;
  private latestQueryId: number = 0;

  constructor(
    providerManager: ProviderManager,
    repository: ISearchRepository,
    eventBus: EventBus,
    logger: Logger,
    config: Config
  ) {
    this.providerManager = providerManager;
    this.repository = repository;
    this.eventBus = eventBus;
    this.logger = logger;
    this.config = config;
  }

  public searchDebounced(query: SearchQuery): void {
    const debounceMs = 300; // default configured via config in actual implementation

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      this.search(query).catch(err => {
        this.logger.error('Debounced search failed', err);
      });
    }, debounceMs);
  }

  public async search(query: SearchQuery): Promise<SearchResult | null> {
    const queryId = ++this.latestQueryId;

    if (!query.query || query.query.trim().length === 0) {
      this.eventBus.emit(SearchEventType.SEARCH_CANCELLED, { query });
      return null;
    }

    this.eventBus.emit(SearchEventType.SEARCH_STARTED, { query });

    try {
      // Execute across available search providers
      const result = await this.providerManager.executeFirstSuccessful<SearchResult>(
        'supportsSearch',
        async (p: any) => {
          const provider = p as ISearchProvider;
          return provider.search(query);
        }
      );

      // Check for cancellation
      if (queryId !== this.latestQueryId) {
        this.logger.debug(`Search for "${query.query}" was cancelled by a newer request.`);
        return null;
      }

      if (result.data) {
        // Validation could be added here similar to MetadataManager
        this.eventBus.emit(SearchEventType.SEARCH_COMPLETED, { query, results: result.data });
        
        // Save to history
        await this.repository.addHistory(query.query);

        return result.data;
      }
      
      return null;
    } catch (error: any) {
      if (queryId !== this.latestQueryId) {
        return null;
      }
      
      const searchError: SearchError = {
        type: SearchErrorType.PROVIDER_UNAVAILABLE,
        message: error.message || 'Search failed',
        originalError: error
      };

      this.logger.error(`Search failed for "${query.query}"`, error);
      this.eventBus.emit(SearchEventType.SEARCH_FAILED, { query, error: searchError });
      return null;
    }
  }

  public async getHistory() {
    return this.repository.getHistory();
  }

  public async clearHistory() {
    return this.repository.clearHistory();
  }
}

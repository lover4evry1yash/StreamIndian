import { Logger } from '../../Logger';
import { CacheManager } from '../../storage/CacheManager';
import { CachePolicyType } from '../../storage/types';
import { ISourceProvider, MediaSearchQuery, CanonicalStreamSource } from '../types';

export class SourceManager {
  private providers: Map<string, ISourceProvider> = new Map();
  private logger: Logger;
  private cacheManager: CacheManager;

  constructor(logger: Logger, cacheManager: CacheManager) {
    this.logger = logger;
    this.cacheManager = cacheManager;
  }

  public registerProvider(provider: ISourceProvider) {
    this.providers.set(provider.id, provider);
    this.logger.info(`Registered source provider: ${provider.name} (Priority: ${provider.priority})`);
  }

  public async initializeAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      try {
        await provider.initialize();
      } catch (err) {
        this.logger.error(`Failed to initialize provider: ${provider.name}`, err);
      }
    }
  }

  public getDiagnostics() {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      health: p.getHealth(),
    }));
  }

  public async search(query: MediaSearchQuery): Promise<CanonicalStreamSource[]> {
    const cacheKey = `sources_${query.mediaId}_${query.season || 0}_${query.episode || 0}`;
    
    // 1. Check cache first
    const cached = await this.cacheManager.get<CanonicalStreamSource[]>(
      'sources', 
      cacheKey, 
      CachePolicyType.STREAM_RESOLUTIONS // Re-using cache policy for now
    );
    
    if (cached && cached.length > 0) {
      this.logger.debug(`[SourceManager] Cache hit for query: ${query.mediaId}`);
      return cached;
    }

    const sortedProviders = Array.from(this.providers.values())
      .filter(p => p.supports(query))
      .sort((a, b) => b.priority - a.priority);

    const promises = sortedProviders.map(async (provider) => {
      try {
        const isHealthy = await provider.healthCheck();
        if (!isHealthy) return [];
        return await provider.search(query);
      } catch (err) {
        this.logger.error(`Provider ${provider.name} failed for query: ${query.mediaId}`, err);
        return [];
      }
    });
      
    const results = await Promise.allSettled(promises);
    let allSources = results
      .filter((r): r is PromiseFulfilledResult<CanonicalStreamSource[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);

    // Remove duplicates
    allSources = this.removeDuplicates(allSources);

    // Cache the result
    if (allSources.length > 0) {
      await this.cacheManager.set('sources', cacheKey, allSources, CachePolicyType.STREAM_RESOLUTIONS);
    }

    return allSources;
  }

  private removeDuplicates(sources: CanonicalStreamSource[]): CanonicalStreamSource[] {
    const seen = new Set<string>();
    return sources.filter(src => {
      let key = src.url || src.infoHash || src.magnet;
      if (!key) key = `${src.title}_${src.quality}_${src.codec}_${src.size}`;
      
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

/**
 * NOTE: This is the legacy provider architecture.
 * It remains to support the legacy IndianMediaProvider and CatalogProvider types
 * until they are migrated to the new IProvider contract in src/core/providers.
 * Do not add new providers here. Use src/core/providers/ProviderManager instead.
 *
 * StreamIndian - Core Provider Registry & Aggregator
 * Manages provider registration, deduplication, ranking, and stream resolution.
 */

import { CatalogProvider, MediaItem, StreamSource } from '../types/tizen';
import { IndianMediaProvider } from './indianMediaCatalog';

class ProviderManager {
  private providers: Map<string, CatalogProvider> = new Map();

  constructor() {
    // Register core Indian catalog provider
    this.registerProvider(new IndianMediaProvider());
  }

  public registerProvider(provider: CatalogProvider) {
    this.providers.set(provider.id, provider);
  }

  public getProviders(): CatalogProvider[] {
    return Array.from(this.providers.values());
  }

  public setProviderEnabled(id: string, enabled: boolean) {
    const p = this.providers.get(id);
    if (p) {
      p.enabled = enabled;
    }
  }

  /**
 * NOTE: This is the legacy provider architecture.
 * It remains to support the legacy IndianMediaProvider and CatalogProvider types
 * until they are migrated to the new IProvider contract in src/core/providers.
 * Do not add new providers here. Use src/core/providers/ProviderManager instead.
 *
   * Aggregates items from all enabled providers, applies deduplication by title + year + language,
   * and ranks by rating & trending status.
   */
  public async getUnifiedCatalog(languageFilter?: string, query?: string): Promise<MediaItem[]> {
    const activeProviders = Array.from(this.providers.values()).filter((p) => p.enabled);
    let allMedia: MediaItem[] = [];

    for (const provider of activeProviders) {
      try {
        const items = await provider.fetchCatalog(languageFilter, query);
        allMedia.push(...items);
      } catch (err) {
        console.error(`Error fetching catalog from provider ${provider.name}:`, err);
      }
    }

    // Deduplication key: lowercase(title)_year_language
    const deduplicatedMap = new Map<string, MediaItem>();

    allMedia.forEach((item) => {
      const key = `${item.title.toLowerCase().trim()}_${item.year}_${item.language.toLowerCase()}`;
      if (!deduplicatedMap.has(key)) {
        deduplicatedMap.set(key, item);
      } else {
        // Merge streams if duplicates exist across providers
        const existing = deduplicatedMap.get(key)!;
        const combinedStreams = [...existing.streams, ...item.streams];
        // Deduplicate streams by ID
        const streamMap = new Map<string, StreamSource>();
        combinedStreams.forEach((st) => streamMap.set(st.id, st));
        existing.streams = Array.from(streamMap.values());
      }
    });

    const results = Array.from(deduplicatedMap.values());

    // Rank: Trending items first, then by IMDb rating descending
    results.sort((a, b) => {
      if (a.isTrending && !b.isTrending) return -1;
      if (!a.isTrending && b.isTrending) return 1;
      return (b.imdbRating || 0) - (a.imdbRating || 0);
    });

    return results;
  }

  /**
 * NOTE: This is the legacy provider architecture.
 * It remains to support the legacy IndianMediaProvider and CatalogProvider types
 * until they are migrated to the new IProvider contract in src/core/providers.
 * Do not add new providers here. Use src/core/providers/ProviderManager instead.
 *
   * Resolves available legal stream sources across active providers
   */
  public async resolveStreamsForMedia(mediaId: string): Promise<StreamSource[]> {
    const activeProviders = Array.from(this.providers.values()).filter((p) => p.enabled);
    let streams: StreamSource[] = [];

    for (const provider of activeProviders) {
      try {
        const resolved = await provider.resolveStream(mediaId);
        streams.push(...resolved);
      } catch (err) {
        console.warn(`Provider ${provider.name} failed stream resolution:`, err);
      }
    }

    return streams;
  }
}

export const providerManager = new ProviderManager();

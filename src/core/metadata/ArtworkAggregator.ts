import { ProviderManager, IArtworkProvider } from '../providers';
import { Logger } from '../Logger';
import { ArtworkSet } from '../models/DomainModels';
import { CacheManager } from '../storage/CacheManager';
import { CachePolicyType } from '../storage/types';

export class ArtworkAggregator {
  private providerManager: ProviderManager;
  private logger: Logger;
  private cache: CacheManager;

  constructor(providerManager: ProviderManager, cache: CacheManager, logger: Logger) {
    this.providerManager = providerManager;
    this.cache = cache;
    this.logger = logger;
  }

  public async getArtwork(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<ArtworkSet | null> {
    const cacheKey = `${type}_${mediaId}`;
    const cached = await this.cache.get<ArtworkSet>('artwork_agg', cacheKey, CachePolicyType.METADATA);
    if (cached) return cached;

    try {
      const results = await this.providerManager.execute<ArtworkSet | null>(
        'supportsArtwork',
        async (p) => {
          const provider = p as unknown as IArtworkProvider;
          return provider.getArtwork(mediaId, type, externalIds);
        }
      );
      
      const mergedSet: ArtworkSet = {
        posters: [],
        backdrops: [],
        logos: [],
        clearLogos: [],
        banners: [],
        landscapes: [],
        thumbs: [],
        clearArts: [],
        discArts: [],
        characterArts: []
      };

      for (const result of results) {
        if (result.data) {
          const art = result.data;
          if (art.posters) mergedSet.posters?.push(...art.posters);
          if (art.backdrops) mergedSet.backdrops?.push(...art.backdrops);
          if (art.logos) mergedSet.logos?.push(...art.logos);
          if (art.clearLogos) mergedSet.clearLogos?.push(...art.clearLogos);
          if (art.banners) mergedSet.banners?.push(...art.banners);
          if (art.landscapes) mergedSet.landscapes?.push(...art.landscapes);
          if (art.thumbs) mergedSet.thumbs?.push(...art.thumbs);
          if (art.clearArts) mergedSet.clearArts?.push(...art.clearArts);
          if (art.discArts) mergedSet.discArts?.push(...art.discArts);
          if (art.characterArts) mergedSet.characterArts?.push(...art.characterArts);
        }
      }

      await this.cache.set<ArtworkSet>('artwork_agg', cacheKey, mergedSet, CachePolicyType.METADATA);
      return mergedSet;
    } catch (e) {
      this.logger.error('Failed to aggregate artwork', e);
      return null;
    }
  }
}

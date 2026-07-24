import { ProviderManager, ProviderCapability, IMetadataProvider, ProviderMergePolicy } from '../providers';
import { Logger } from '../Logger';
import { Movie, Series, Anime, Episode, MediaReference, UserList } from '../models/DomainModels';
import { IPersonalizationProvider, ICollectionProvider, IRatingsProvider } from '../providers';

export class MetadataAggregator {
  private providerManager: ProviderManager;
  private mergePolicy: ProviderMergePolicy;
  private logger: Logger;

  constructor(
    providerManager: ProviderManager,
    mergePolicy: ProviderMergePolicy,
    logger: Logger
  ) {
    this.providerManager = providerManager;
    this.mergePolicy = mergePolicy;
    this.logger = logger;
  }

  public async getMovie(id: string): Promise<Movie | null> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsMetadata',
      async (p: any) => {
        const provider = p as IMetadataProvider;
        return provider.getMovie(id);
      }
    );
    
    // In a full implementation, we'd loop through this.mergePolicy.overview, 
    // fetch from all configured providers, and merge fields.
    // For now, TMDB is the only fully implemented provider.
    return result.data as Movie || null;
  }

  public async getSeries(id: string): Promise<Series | null> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsMetadata',
      async (p: any) => {
        const provider = p as IMetadataProvider;
        return provider.getSeries(id);
      }
    );
    return result.data as Series || null;
  }
  
  public async getEpisodes(seriesId: string, seasonNumber: number): Promise<Episode[] | null> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsMetadata', // or TV_EPISODES
      async (p: any) => {
        const provider = p as IMetadataProvider;
        if (provider.getEpisodes) {
          return provider.getEpisodes(seriesId, seasonNumber);
        }
        return null;
      }
    );
    return result.data as Episode[] || null;
  }


  // --- Personalization & Collections ---

  public async getTrending(type: 'movie' | 'series', options?: { language?: string; page?: number }): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsPersonalization',
      async (p: any) => {
        const provider = p as IPersonalizationProvider;
        if (provider.getTrending) return provider.getTrending(type, options);
        return null;
      }
    );
    return result.data || [];
  }

  public async getRecommendations(type: 'movie' | 'series', id?: string): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsRecommendations',
      async (p: any) => {
        const provider = p as IPersonalizationProvider;
        if (provider.getRecommendations) return provider.getRecommendations(type, id);
        return null;
      }
    );
    return result.data || [];
  }

  public async getWatchHistory(): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsPersonalization',
      async (p: any) => {
        const provider = p as IPersonalizationProvider;
        if (provider.getWatchHistory) return provider.getWatchHistory();
        return null;
      }
    );
    return result.data || [];
  }

  public async getContinueWatching(): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsPersonalization',
      async (p: any) => {
        const provider = p as IPersonalizationProvider;
        if (provider.getContinueWatching) return provider.getContinueWatching();
        return null;
      }
    );
    return result.data || [];
  }

  public async getCollection(id: string): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsCollections',
      async (p: any) => {
        const provider = p as ICollectionProvider;
        if (provider.getCollection) return provider.getCollection(id);
        return null;
      }
    );
    return result.data || [];
  }


  public async getRatings(mediaId: string, type: 'movie' | 'series'): Promise<import('../models/DomainModels').Rating[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsRecommendations',
      async (p: any) => {
        const provider = p as IRatingsProvider;
        if (provider.getRatings) return provider.getRatings(mediaId, type);
        return null;
      }
    );
    return result.data || [];
  }

  public async getTopRated(type: 'movie' | 'series', options?: { language?: string; page?: number }): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsCollections',
      async (p: any) => {
        const provider = p as ICollectionProvider;
        if (provider.getTopRated) return provider.getTopRated(type, options);
        return null;
      }
    );
    return result.data || [];
  }

  public async getPopular(type: 'movie' | 'series', options?: { language?: string; page?: number }): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsCollections',
      async (p: any) => {
        const provider = p as ICollectionProvider;
        if (provider.getPopular) return provider.getPopular(type, options);
        return null;
      }
    );
    return result.data || [];
  }

  public async getAnime(id: string): Promise<Anime | null> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      'supportsMetadata',
      async (p: any) => {
        const provider = p as IMetadataProvider;
        if (provider.getAnime) {
          return provider.getAnime(id);
        }
        return null;
      }
    );
    return result.data as Anime || null;
  }
}

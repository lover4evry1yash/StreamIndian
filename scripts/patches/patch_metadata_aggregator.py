content = open('src/core/metadata/MetadataAggregator.ts').read()

import_add = "import { Movie, Series, Anime, Episode, MediaReference, UserList } from '../models/DomainModels';\nimport { IPersonalizationProvider, ICollectionProvider } from '../providers';"
content = content.replace("import { Movie, Series, Anime, Episode } from '../models/DomainModels';", import_add)

new_methods = """
  // --- Personalization & Collections ---

  public async getTrending(type: 'movie' | 'series'): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      ProviderCapability.TRENDING,
      async (p: any) => {
        const provider = p as IPersonalizationProvider;
        if (provider.getTrending) return provider.getTrending(type);
        return null;
      }
    );
    return result.data || [];
  }

  public async getRecommendations(type: 'movie' | 'series', id?: string): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      ProviderCapability.RECOMMENDATIONS,
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
      ProviderCapability.WATCH_HISTORY,
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
      ProviderCapability.CONTINUE_WATCHING,
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
      ProviderCapability.COLLECTIONS,
      async (p: any) => {
        const provider = p as ICollectionProvider;
        if (provider.getCollection) return provider.getCollection(id);
        return null;
      }
    );
    return result.data || [];
  }

  public async getTopRated(type: 'movie' | 'series'): Promise<MediaReference[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      ProviderCapability.COLLECTIONS, // Assuming Collections capability handles top rated lists
      async (p: any) => {
        const provider = p as ICollectionProvider;
        if (provider.getTopRated) return provider.getTopRated(type);
        return null;
      }
    );
    return result.data || [];
  }
"""

if "getTrending(" not in content:
    content = content.replace("  public async getAnime", new_methods + "\n  public async getAnime")
    open('src/core/metadata/MetadataAggregator.ts', 'w').write(content)

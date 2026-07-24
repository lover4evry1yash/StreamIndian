content = open('src/core/metadata/MetadataAggregator.ts').read()

import_add = "import { IPersonalizationProvider, ICollectionProvider, IRatingsProvider } from '../providers';"
content = content.replace("import { IPersonalizationProvider, ICollectionProvider } from '../providers';", import_add)

new_methods = """
  public async getRatings(mediaId: string, type: 'movie' | 'series'): Promise<import('../models/DomainModels').Rating[]> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      ProviderCapability.RATINGS,
      async (p: any) => {
        const provider = p as IRatingsProvider;
        if (provider.getRatings) return provider.getRatings(mediaId, type);
        return null;
      }
    );
    return result.data || [];
  }
"""

if "getRatings(" not in content:
    content = content.replace("  public async getTopRated", new_methods + "\n  public async getTopRated")
    open('src/core/metadata/MetadataAggregator.ts', 'w').write(content)

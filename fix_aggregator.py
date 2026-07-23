content = open('src/core/metadata/MetadataAggregator.ts').read()
old = """  public async getAnime(id: string): Promise<Anime | null> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      ProviderCapability.ANIME,
      async (p: any) => {
        // Placeholder for Anime fetching from Anilist
        return null;
      }
    );
    return result.data as Anime || null;
  }"""
new = """  public async getAnime(id: string): Promise<Anime | null> {
    const result = await this.providerManager.executeFirstSuccessful<any>(
      ProviderCapability.ANIME,
      async (p: any) => {
        const provider = p as IMetadataProvider;
        if (provider.getAnime) {
          return provider.getAnime(id);
        }
        return null;
      }
    );
    return result.data as Anime || null;
  }"""
content = content.replace(old, new)
open('src/core/metadata/MetadataAggregator.ts', 'w').write(content)

content = open('src/core/providers/fanart/FanartProvider.ts').read()
content = content.replace("export class FanartProvider implements IProvider {", "import { IArtworkProvider } from '../types';\nexport class FanartProvider implements IArtworkProvider {")
old_methods = """  public async getMovieArtwork(tmdbId: string): Promise<ArtworkSet | null> {
    if (!this.client) throw new Error('FanartProvider not initialized');
    const data = await this.client.getMovieArtwork(tmdbId);
    if (data) {
      return FanartMapper.mapMovie(data);
    }
    return null;
  }

  public async getSeriesArtwork(tvdbId: string): Promise<ArtworkSet | null> {
    if (!this.client) throw new Error('FanartProvider not initialized');
    const data = await this.client.getTvArtwork(tvdbId);
    if (data) {
      return FanartMapper.mapTv(data);
    }
    return null;
  }"""
new_methods = """  public async getArtwork(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<ArtworkSet | null> {
    if (!this.client) throw new Error('FanartProvider not initialized');
    if (type === 'movie') {
      const tmdbId = externalIds?.tmdbId || mediaId;
      const data = await this.client.getMovieArtwork(tmdbId);
      if (data) return FanartMapper.mapMovie(data);
    } else {
      const tvdbId = externalIds?.tvdbId || mediaId;
      const data = await this.client.getTvArtwork(tvdbId);
      if (data) return FanartMapper.mapTv(data);
    }
    return null;
  }"""
content = content.replace(old_methods, new_methods)
open('src/core/providers/fanart/FanartProvider.ts', 'w').write(content)

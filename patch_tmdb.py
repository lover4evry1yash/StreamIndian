content = open('src/core/providers/tmdb/TMDBProvider.ts').read()
content = content.replace("IImageProvider", "IArtworkProvider")
old_methods = """  // --- IImageProvider ---
  public async getPoster(mediaId: string): Promise<string | null> {
    const movie = await this.getMovie(mediaId);
    if (movie && movie.images && movie.images.length > 0) {
      return movie.images.find((i: any) => i.type === 'poster')?.url || null;
    }
    return null;
  }

  public async getBackdrop(mediaId: string): Promise<string | null> {
    const movie = await this.getMovie(mediaId);
    if (movie && movie.images && movie.images.length > 0) {
      return movie.images.find((i: any) => i.type === 'backdrop')?.url || null;
    }
    return null;
  }

  public async getLogo(mediaId: string): Promise<string | null> {
    const movie = await this.getMovie(mediaId);
    if (movie && movie.images && movie.images.length > 0) {
      return movie.images.find((i: any) => i.type === 'logo')?.url || null;
    }
    return null;
  }"""
new_methods = """  // --- IArtworkProvider ---
  public async getArtwork(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<import('../../models/DomainModels').ArtworkSet | null> {
    if (type === 'movie') {
      const movie = await this.getMovie(mediaId);
      return movie?.artwork || null;
    } else {
      const series = await this.getSeries(mediaId);
      return series?.artwork || null;
    }
  }"""
if old_methods in content:
    content = content.replace(old_methods, new_methods)
else:
    print("Warning: could not find old_methods, trying a generic replace")
open('src/core/providers/tmdb/TMDBProvider.ts', 'w').write(content)

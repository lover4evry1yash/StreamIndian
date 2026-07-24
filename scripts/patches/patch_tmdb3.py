import re
content = open('src/core/providers/tmdb/TMDBProvider.ts').read()
old_methods_regex = re.compile(r'  // --- IArtworkProvider ---.*?\n\s+public async getPoster.*?return logo \? this\.mapper\.getImageUrl\(logo\.file_path\) : null;\n  }', re.DOTALL)

new_methods = """  // --- IArtworkProvider ---
  public async getArtwork(mediaId: string, type: 'movie' | 'series', externalIds?: Record<string, string>): Promise<import('../../models/DomainModels').ArtworkSet | null> {
    const cleanId = mediaId.replace('tmdb_', '');
    if (type === 'movie') {
      const movie = await this.getMovie(cleanId);
      return movie?.artwork || null;
    } else {
      const series = await this.getSeries(cleanId);
      return series?.artwork || null;
    }
  }"""
if old_methods_regex.search(content):
    content = old_methods_regex.sub(new_methods, content)
else:
    print("Warning: could not find match")
open('src/core/providers/tmdb/TMDBProvider.ts', 'w').write(content)

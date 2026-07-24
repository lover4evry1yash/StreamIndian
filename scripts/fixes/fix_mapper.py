content = open('src/core/providers/tmdb/TMDBMapper.ts').read()
content = content.replace("  }\n}\n  private mapArtwork", "  }\n  private mapArtwork")
content = content + "\n}\n"
open('src/core/providers/tmdb/TMDBMapper.ts', 'w').write(content)

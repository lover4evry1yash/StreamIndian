import re

content = open('src/core/providers/tmdb/TMDBMapper.ts').read()

content = content.replace(
"""import { 
  Movie, Series, Season, Episode, Collection, Person,
  Image, Genre, Video, ExternalId, Rating, Credits
} from '../../models/DomainModels';""",
"""import { 
  Movie, Series, Season, Episode, Collection, Person,
  Image, Genre, Video, ExternalIds, Rating, Credits, ArtworkSet
} from '../../models/DomainModels';""")

content = content.replace("images: this.mapImages(data.poster_path, data.backdrop_path),", "artwork: this.mapArtwork(data.poster_path, data.backdrop_path),")
content = content.replace("images: this.mapImages(data.poster_path, null),", "artwork: this.mapArtwork(data.poster_path, null),")
content = content.replace("images: this.mapImages(data.still_path, null),", "artwork: this.mapArtwork(data.still_path, null),")

artwork_method = """
  private mapArtwork(posterPath?: string, backdropPath?: string): ArtworkSet {
    const artwork: ArtworkSet = {
      posters: [],
      backdrops: [],
      banners: [],
      landscapes: [],
      thumbs: [],
      logos: [],
      clearLogos: [],
      clearArts: [],
      discArts: [],
      characterArts: []
    };
    if (posterPath) {
      artwork.posters.push({
        type: 'poster',
        url: this.getImageUrl(posterPath)!,
        provider: 'tmdb'
      });
    }
    if (backdropPath) {
      artwork.backdrops.push({
        type: 'backdrop',
        url: this.getImageUrl(backdropPath)!,
        provider: 'tmdb'
      });
    }
    return artwork;
  }
"""

content = content + artwork_method
open('src/core/providers/tmdb/TMDBMapper.ts', 'w').write(content)

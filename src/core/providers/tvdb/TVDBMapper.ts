import { Movie, Series, Season, Episode, ExternalIds, Genre, Image, ArtworkSet, Rating, Studio, Network, Certification, Person, Credits } from '../../models/DomainModels';

export class TVDBMapper {
  
  private static extractExternalIds(remoteIds: any[]): ExternalIds {
    const ext: ExternalIds = {};
    if (!remoteIds) return ext;
    
    for (const item of remoteIds) {
      if (item.sourceName === 'IMDB') ext.imdbId = item.id;
      if (item.sourceName === 'TMDB') ext.tmdbId = item.id;
      if (item.sourceName === 'MyAnimeList') ext.malId = item.id;
    }
    return ext;
  }
  
  private static createArtworkSet(image: string | undefined, poster?: string, backdrop?: string): ArtworkSet {
    const getImages = (url?: string, type: any = 'poster'): Image[] => url ? [{ url, type }] : [];
    
    return {
      posters: getImages(poster || image, 'poster'),
      backdrops: getImages(backdrop, 'backdrop'),
      banners: [],
      landscapes: [],
      thumbs: [],
      logos: [],
      clearLogos: [],
      clearArts: [],
      discArts: [],
      characterArts: []
    };
  }

  public static mapSeries(data: any): Series {
    return {
      id: `tvdb_${data.id}`,
      title: data.name,
      originalTitle: data.originalName || data.name,
      overview: data.overview || '',
      firstAirDate: data.firstAired,
      lastAirDate: data.lastAired,
      status: data.status?.name || 'Unknown',
      genres: data.genres ? data.genres.map((g: any) => ({ id: String(g.id), name: g.name })) : [],
      images: [],
      artwork: this.createArtworkSet(data.image, data.image, data.image),
      videos: [],
      externalIds: { ...this.extractExternalIds(data.remoteIds), tvdbId: String(data.id) },
      ratings: [], // Can parse data.score if available
      seasonsCount: data.seasons ? data.seasons.length : 0,
      episodesCount: data.episodes ? data.episodes.length : 0,
      networks: data.networks ? data.networks.map((n: any) => ({ id: String(n.id), name: n.name, country: n.country })) : [],
      certifications: data.contentRatings ? data.contentRatings.map((c: any) => ({ rating: c.name, country: c.country })) : []
    };
  }

  public static mapMovie(data: any): Movie {
    return {
      id: `tvdb_${data.id}`,
      title: data.name,
      originalTitle: data.originalName || data.name,
      overview: data.overview || '',
      releaseDate: data.year ? String(data.year) : undefined,
      durationMinutes: data.runtime || 0,
      genres: data.genres ? data.genres.map((g: any) => ({ id: String(g.id), name: g.name })) : [],
      images: [],
      artwork: this.createArtworkSet(data.image, data.image, data.image),
      videos: [],
      externalIds: { ...this.extractExternalIds(data.remoteIds), tvdbId: String(data.id) },
      ratings: [],
      studios: data.companies ? data.companies.map((c: any) => ({ id: String(c.id), name: c.name })) : []
    };
  }

  public static mapEpisode(data: any, seriesId: string): Episode {
    return {
      id: `tvdb_${data.id}`,
      seriesId: `tvdb_${seriesId}`,
      seasonNumber: data.seasonNumber,
      episodeNumber: data.number,
      title: data.name || `Episode ${data.number}`,
      overview: data.overview || '',
      airDate: data.aired,
      durationMinutes: data.runtime || 0,
      images: [],
      artwork: this.createArtworkSet(data.image, data.image, data.image),
      externalIds: { tvdbId: String(data.id) },
      ratings: []
    };
  }
}

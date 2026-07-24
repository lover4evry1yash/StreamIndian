import { 
  Movie, Series, Season, Episode, Collection, Person,
  Genre, Video, ExternalIds, Rating, Credits, ArtworkSet
} from '../../models/DomainModels';
import { Config } from '../../Config';

export class TMDBMapper {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  private getImageBaseUrl(): string {
    const tmdbConfig = this.config.get('tmdb');
    return tmdbConfig?.imageBaseUrl || 'https://image.tmdb.org/t/p/';
  }

  public getImageUrl(path: string | null | undefined, size: string = 'original'): string | null {
    if (!path) return null;
    return `${this.getImageBaseUrl()}${size}${path}`;
  }

  public mapMovie(data: any): Partial<Movie> {
    return {
      id: String(data.id),
      mediaType: 'movie',
      title: data.title,
      originalTitle: data.original_title,
      overview: data.overview,
      releaseDate: data.release_date,
      durationMinutes: data.runtime,
      genres: this.mapGenres(data.genres),
      artwork: this.mapArtwork(data.poster_path, data.backdrop_path),
      videos: this.mapVideos(data.videos?.results),
      ratings: [{ provider: 'tmdb', score: data.vote_average, votes: data.vote_count }],
      credits: this.mapCredits(data.credits),
      collection: data.belongs_to_collection ? this.mapCollection(data.belongs_to_collection) as Collection : undefined,
    };
  }

  public mapSeries(data: any): Partial<Series> {
    return {
      id: String(data.id),
      mediaType: 'series',
      title: data.name,
      originalTitle: data.original_name,
      overview: data.overview,
      firstAirDate: data.first_air_date,
      lastAirDate: data.last_air_date,
      status: data.status,
      genres: this.mapGenres(data.genres),
      artwork: this.mapArtwork(data.poster_path, data.backdrop_path),
      videos: this.mapVideos(data.videos?.results),
      ratings: [{ provider: 'tmdb', score: data.vote_average, votes: data.vote_count }],
      credits: this.mapCredits(data.credits),
      seasonsCount: data.number_of_seasons,
      episodesCount: data.number_of_episodes,
    };
  }

  public mapSeason(seriesId: string, data: any): Partial<Season> {
    return {
      id: String(data.id),
      seriesId: String(seriesId),
      seasonNumber: data.season_number,
      title: data.name,
      overview: data.overview,
      airDate: data.air_date,
      artwork: this.mapArtwork(data.poster_path, undefined),
      episodesCount: data.episodes?.length || 0,
    };
  }

  public mapEpisode(seriesId: string, data: any): Partial<Episode> {
    return {
      id: String(data.id),
      seriesId: String(seriesId),
      seasonNumber: data.season_number,
      episodeNumber: data.episode_number,
      title: data.name,
      overview: data.overview,
      airDate: data.air_date,
      durationMinutes: data.runtime,
      artwork: this.mapArtwork(data.still_path, undefined),
      ratings: [{ provider: 'tmdb', score: data.vote_average, votes: data.vote_count }],
    };
  }

  public mapCollection(data: any): Partial<Collection> {
    return {
      id: String(data.id),
      name: data.name,
      posterImage: this.getImageUrl(data.poster_path) || undefined,
      backdropImage: this.getImageUrl(data.backdrop_path) || undefined,
    };
  }

  private mapGenres(genres?: any[]): Genre[] {
    if (!genres) return [];
    return genres.map(g => ({
      id: String(g.id),
      name: g.name
    }));
  }

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

  private mapVideos(videos?: any[]): Video[] {
    if (!videos) return [];
    return videos.map(v => ({
      type: v.type?.toLowerCase() || 'clip',
      url: v.key,
      site: v.site,
      language: v.iso_639_1,
      resolution: String(v.size),
    }));
  }

  public mapMediaReference(data: any, type: 'movie' | 'series'): import('../../models/DomainModels').MediaReference {
    return {
      id: `tmdb_${data.id}`,
      type: type,
      title: type === 'movie' ? data.title || data.original_title : data.name || data.original_name,
      year: type === 'movie' ? (data.release_date ? parseInt(data.release_date.substring(0, 4)) : undefined) : (data.first_air_date ? parseInt(data.first_air_date.substring(0, 4)) : undefined),
      posterUrl: this.getImageUrl(data.poster_path) || undefined,
      backdropUrl: this.getImageUrl(data.backdrop_path) || undefined,
      language: data.original_language,
      externalIds: {
        tmdbId: String(data.id)
      }
    };
  }

  private mapCredits(credits?: any): Credits | undefined {
    if (!credits) return undefined;
    
    return {
      cast: (credits.cast || []).slice(0, 15).map((c: any) => ({
        id: String(c.id),
        name: c.name,
        role: 'Actor',
        character: c.character,
        profileImage: this.getImageUrl(c.profile_path) || undefined,
      })),
      crew: (credits.crew || []).slice(0, 10).map((c: any) => ({
        id: String(c.id),
        name: c.name,
        role: c.job,
        profileImage: this.getImageUrl(c.profile_path) || undefined,
      })),
    };
  }
}

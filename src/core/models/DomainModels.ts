export interface ExternalIds {
  tmdbId?: string;
  tvdbId?: string;
  imdbId?: string;
  anilistId?: string;
  anidbId?: string;
  malId?: string;
  traktId?: string;
  tvmazeId?: string;
  [key: string]: string | undefined;
}

export interface Rating {
  provider: string;
  score: number;
  votes?: number;
}

export interface Genre {
  id: string;
  name: string;
}

export interface Image {
  type: 'poster' | 'backdrop' | 'banner' | 'landscape' | 'thumb' | 'logo' | 'clearlogo' | 'clearart' | 'discart' | 'characterart' | 'profile';
  url: string;
  width?: number;
  height?: number;
  language?: string;
  provider?: string;
}

export interface ArtworkSet {
  posters: Image[];
  backdrops: Image[];
  banners: Image[];
  landscapes: Image[];
  thumbs: Image[];
  logos: Image[];
  clearLogos: Image[];
  clearArts: Image[];
  discArts: Image[];
  characterArts: Image[];
}

export interface Video {
  type: 'trailer' | 'teaser' | 'featurette' | 'clip';
  url: string;
  site: string;
  language?: string;
  resolution?: string;
}

export interface Person {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly character?: string;
  readonly profileImage?: string;
}

export interface Character {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly voiceActors?: Person[];
  readonly characterImage?: string;
}

export interface Studio {
  readonly id: string;
  readonly name: string;
  readonly logo?: string;
}

export interface Network {
  readonly id: string;
  readonly name: string;
  readonly country?: string;
}

export interface StreamingService {
  readonly id: string;
  readonly name: string;
  readonly region: string;
  readonly icon?: string;
}

export interface Certification {
  readonly rating: string;
  readonly country: string;
  readonly meaning?: string;
}

export interface Relation {
  readonly id: string;
  readonly type: string; // e.g. prequel, sequel, adaptation
  readonly mediaType: 'movie' | 'series' | 'anime';
  readonly title: string;
}

export interface Credits {
  readonly cast: Person[];
  readonly crew: Person[];
}

export interface Collection {
  readonly id: string;
  readonly name: string;
  readonly posterImage?: string;
  readonly backdropImage?: string;
}

export interface StreamReference {
  readonly id: string;
  readonly url: string;
  readonly quality?: string;
  readonly format?: string;
  readonly language?: string;
}

export interface SubtitleReference {
  readonly id: string;
  readonly url: string;
  readonly language: string;
  readonly format: string;
}

export interface Movie {
  readonly id: string;
  readonly mediaType?: 'movie';
  readonly title: string;
  readonly originalTitle?: string;
  readonly overview: string;
  readonly releaseDate?: string;
  readonly durationMinutes?: number;
  readonly genres: Genre[];
  readonly images: Image[]; // legacy for now, or just migrate to artwork
  readonly artwork: ArtworkSet;
  readonly videos: Video[];
  readonly externalIds: ExternalIds;
  readonly ratings: Rating[];
  readonly credits?: Credits;
  readonly collection?: Collection;
  readonly studios?: Studio[];
  readonly certifications?: Certification[];
}

export interface Series {
  readonly id: string;
  readonly mediaType?: 'series';
  readonly title: string;
  readonly originalTitle?: string;
  readonly overview: string;
  readonly firstAirDate?: string;
  readonly lastAirDate?: string;
  readonly status?: string;
  readonly genres: Genre[];
  readonly images: Image[]; // legacy
  readonly artwork: ArtworkSet;
  readonly videos: Video[];
  readonly externalIds: ExternalIds;
  readonly ratings: Rating[];
  readonly credits?: Credits;
  readonly seasonsCount: number;
  readonly episodesCount: number;
  readonly networks?: Network[];
  readonly certifications?: Certification[];
}

export interface Anime {
  readonly id: string;
  readonly type: 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music' | 'short';
  readonly romajiTitle: string;
  readonly englishTitle?: string;
  readonly nativeTitle?: string;
  readonly overview: string;
  readonly season?: string;
  readonly seasonYear?: number;
  readonly episodes?: number;
  readonly status: string;
  readonly sourceMaterial?: string;
  readonly studios: Studio[];
  readonly characters: Character[];
  readonly relations: Relation[];
  readonly popularity?: number;
  readonly averageScore?: number;
  readonly tags: string[];
  readonly genres: Genre[];
  readonly ageRating?: string;
  readonly isAdult: boolean;
  readonly openingThemes: string[];
  readonly endingThemes: string[];
  readonly artwork: ArtworkSet;
  readonly externalIds: ExternalIds;
  readonly ratings: Rating[];
}

export interface Season {
  readonly id: string;
  readonly seriesId: string;
  readonly seasonNumber: number;
  readonly title: string;
  readonly overview: string;
  readonly airDate?: string;
  readonly images: Image[];
  readonly artwork: ArtworkSet;
  readonly episodesCount: number;
}

export interface Episode {
  readonly id: string;
  readonly seriesId: string;
  readonly seasonNumber: number;
  readonly episodeNumber: number;
  readonly title: string;
  readonly overview: string;
  readonly airDate?: string;
  readonly durationMinutes?: number;
  readonly images: Image[];
  readonly artwork: ArtworkSet;
  readonly externalIds: ExternalIds;
  readonly ratings: Rating[];
  readonly credits?: Credits;
}

export interface MediaReference {
  readonly id: string;
  readonly type: 'movie' | 'series' | 'episode' | 'anime';
  readonly title: string;
  readonly year?: number;
  readonly posterUrl?: string;
  readonly backdropUrl?: string;
  readonly progress?: number; // 0-100
  readonly lastWatched?: number;
  readonly externalIds?: ExternalIds;
}

export interface UserList {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly itemCount: number;
}

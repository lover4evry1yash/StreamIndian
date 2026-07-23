import { 
  Movie, Series, Anime, Season, Episode, 
  Person, Character, Studio, Collection, ArtworkSet, Image, Genre, 
  ExternalIds, Rating, Video, Credits, Certification, Network, Relation
} from '../models/DomainModels';

export class ValidationLayer {
  public static validateMovie(movie: Partial<Movie>): Movie {
    if (!movie.id) throw new Error('Movie must have an id');
    if (!movie.title) throw new Error('Movie must have a title');
    
    return {
      id: String(movie.id),
      title: String(movie.title).trim(),
      originalTitle: movie.originalTitle,
      overview: movie.overview || '',
      releaseDate: this.validateDate(movie.releaseDate),
      durationMinutes: this.validatePositiveInteger(movie.durationMinutes),
      genres: this.validateGenres(movie.genres),
      artwork: this.validateArtworkSet(movie.artwork, { id: String(movie.id), type: 'movie' }),
      videos: this.validateVideos(movie.videos),
      externalIds: this.validateExternalIds(movie.externalIds),
      ratings: this.validateRatings(movie.ratings),
      credits: this.validateCredits(movie.credits),
      collection: movie.collection ? this.validateCollection(movie.collection) : undefined,
      studios: this.validateStudios(movie.studios),
      certifications: this.validateCertifications(movie.certifications),
    } as Movie;
  }

  public static validateSeries(series: Partial<Series>): Series {
    if (!series.id) throw new Error('Series must have an id');
    if (!series.title) throw new Error('Series must have a title');
    
    return {
      id: String(series.id),
      title: String(series.title).trim(),
      originalTitle: series.originalTitle,
      overview: series.overview || '',
      firstAirDate: this.validateDate(series.firstAirDate),
      lastAirDate: this.validateDate(series.lastAirDate),
      status: series.status,
      genres: this.validateGenres(series.genres),
      artwork: this.validateArtworkSet(series.artwork, { id: String(series.id), type: 'series' }),
      videos: this.validateVideos(series.videos),
      externalIds: this.validateExternalIds(series.externalIds),
      ratings: this.validateRatings(series.ratings),
      credits: this.validateCredits(series.credits),
      seasonsCount: this.validatePositiveInteger(series.seasonsCount) || 0,
      episodesCount: this.validatePositiveInteger(series.episodesCount) || 0,
      networks: this.validateNetworks(series.networks),
      certifications: this.validateCertifications(series.certifications),
    } as Series;
  }

  public static validateAnime(anime: Partial<Anime>): Anime {
    if (!anime.id) throw new Error('Anime must have an id');
    if (!anime.romajiTitle) throw new Error('Anime must have a romajiTitle');

    return {
      id: String(anime.id),
      type: anime.type || 'tv',
      romajiTitle: String(anime.romajiTitle).trim(),
      englishTitle: anime.englishTitle,
      nativeTitle: anime.nativeTitle,
      overview: anime.overview || '',
      season: anime.season,
      seasonYear: this.validatePositiveInteger(anime.seasonYear),
      episodes: this.validatePositiveInteger(anime.episodes),
      status: anime.status || 'FINISHED',
      sourceMaterial: anime.sourceMaterial,
      studios: this.validateStudios(anime.studios),
      characters: this.validateCharacters(anime.characters),
      relations: this.validateRelations(anime.relations),
      popularity: this.validatePositiveInteger(anime.popularity),
      averageScore: this.validatePositiveInteger(anime.averageScore),
      tags: Array.isArray(anime.tags) ? anime.tags.map(t => String(t)) : [],
      genres: this.validateGenres(anime.genres),
      ageRating: anime.ageRating,
      isAdult: !!anime.isAdult,
      openingThemes: Array.isArray(anime.openingThemes) ? anime.openingThemes.map(t => String(t)) : [],
      endingThemes: Array.isArray(anime.endingThemes) ? anime.endingThemes.map(t => String(t)) : [],
      artwork: this.validateArtworkSet(anime.artwork, { id: String(anime.id), type: 'anime' }),
      externalIds: this.validateExternalIds(anime.externalIds),
      ratings: this.validateRatings(anime.ratings),
    } as Anime;
  }

  public static validateSeason(season: Partial<Season>): Season {
    if (!season.id) throw new Error('Season must have an id');
    if (!season.seriesId) throw new Error('Season must have a seriesId');
    if (season.seasonNumber === undefined) throw new Error('Season must have a seasonNumber');
    
    return {
      id: String(season.id),
      seriesId: String(season.seriesId),
      seasonNumber: this.validatePositiveInteger(season.seasonNumber, true)!,
      title: season.title || `Season ${season.seasonNumber}`,
      overview: season.overview || '',
      airDate: this.validateDate(season.airDate),
      artwork: this.validateArtworkSet(season.artwork, { id: String(season.id), type: 'season' }),
      episodesCount: this.validatePositiveInteger(season.episodesCount) || 0,
    } as Season;
  }

  public static validateEpisode(episode: Partial<Episode>): Episode {
    if (!episode.id) throw new Error('Episode must have an id');
    if (!episode.seriesId) throw new Error('Episode must have a seriesId');
    if (episode.seasonNumber === undefined) throw new Error('Episode must have a seasonNumber');
    if (episode.episodeNumber === undefined) throw new Error('Episode must have an episodeNumber');
    
    return {
      id: String(episode.id),
      seriesId: String(episode.seriesId),
      seasonNumber: this.validatePositiveInteger(episode.seasonNumber, true)!,
      episodeNumber: this.validatePositiveInteger(episode.episodeNumber, true)!,
      title: episode.title || `Episode ${episode.episodeNumber}`,
      overview: episode.overview || '',
      airDate: this.validateDate(episode.airDate),
      durationMinutes: this.validatePositiveInteger(episode.durationMinutes),
      artwork: this.validateArtworkSet(episode.artwork, { id: String(episode.id), type: 'episode' }),
      externalIds: this.validateExternalIds(episode.externalIds),
      ratings: this.validateRatings(episode.ratings),
      credits: this.validateCredits(episode.credits),
    } as Episode;
  }

  public static validatePerson(person: Partial<Person>): Person {
    if (!person.id) throw new Error('Person must have an id');
    if (!person.name) throw new Error('Person must have a name');
    return {
      id: String(person.id),
      name: String(person.name).trim(),
      role: person.role || 'Unknown',
      character: person.character,
      profileImage: person.profileImage ? String(person.profileImage) : undefined,
    } as Person;
  }

  public static validateCharacter(character: Partial<Character>): Character {
    if (!character.id) throw new Error('Character must have an id');
    if (!character.name) throw new Error('Character must have a name');
    return {
      id: String(character.id),
      name: String(character.name).trim(),
      role: character.role || 'Unknown',
      characterImage: character.characterImage ? String(character.characterImage) : undefined,
      voiceActors: Array.isArray(character.voiceActors) ? character.voiceActors.map(v => {
        try { return this.validatePerson(v); } catch { return null; }
      }).filter(Boolean) as Person[] : [],
    } as Character;
  }

  public static validateCollection(collection: Partial<Collection>): Collection {
    if (!collection.id) throw new Error('Collection must have an id');
    if (!collection.name) throw new Error('Collection must have a name');
    return {
      id: String(collection.id),
      name: String(collection.name).trim(),
      posterImage: collection.posterImage ? String(collection.posterImage) : undefined,
      backdropImage: collection.backdropImage ? String(collection.backdropImage) : undefined,
    } as Collection;
  }

  public static validateImage(image: Partial<Image>): Image {
    if (!image.type) throw new Error('Image must have a type');
    if (!image.url) throw new Error('Image must have a url');
    return {
      type: image.type,
      url: String(image.url),
      width: this.validatePositiveInteger(image.width),
      height: this.validatePositiveInteger(image.height),
      language: image.language,
      provider: image.provider,
    } as Image;
  }

  // --- Utility Validators ---

  private static validateDate(dateStr?: string): string | undefined {
    if (!dateStr) return undefined;
    if (Number.isNaN(Date.parse(dateStr))) return undefined;
    return dateStr;
  }

  private static validatePositiveInteger(num?: number, allowZero = false): number | undefined {
    if (num === undefined || num === null) return undefined;
    if (typeof num !== 'number' || Number.isNaN(num)) return undefined;
    if (num < 0 || (!allowZero && num === 0)) return undefined;
    return Math.floor(num);
  }

  private static validateGenres(genres?: Genre[]): Genre[] {
    if (!Array.isArray(genres)) return [];
    return genres.filter(g => g && g.id && g.name).map(g => ({
      id: String(g.id),
      name: String(g.name).trim()
    }));
  }

  private static validateArtworkSet(artwork?: Partial<ArtworkSet>, mediaContext?: { id: string, type: string }): ArtworkSet {
    const defaultArtwork: ArtworkSet = {
      posters: [], backdrops: [], banners: [], landscapes: [], 
      thumbs: [], logos: [], clearLogos: [], clearArts: [], 
      discArts: [], characterArts: []
    };
    if (!artwork) return defaultArtwork;
    
    const validated = {
      posters: this.validateImages(artwork.posters),
      backdrops: this.validateImages(artwork.backdrops),
      banners: this.validateImages(artwork.banners),
      landscapes: this.validateImages(artwork.landscapes),
      thumbs: this.validateImages(artwork.thumbs),
      logos: this.validateImages(artwork.logos),
      clearLogos: this.validateImages(artwork.clearLogos),
      clearArts: this.validateImages(artwork.clearArts),
      discArts: this.validateImages(artwork.discArts),
      characterArts: this.validateImages(artwork.characterArts),
    };
    if (mediaContext) {
      const { id, type } = mediaContext;
      validated.posters.unshift({ type: 'poster', url: `artwork://${type}/${id}/poster`, provider: 'virtual' });
      validated.backdrops.unshift({ type: 'backdrop', url: `artwork://${type}/${id}/backdrop`, provider: 'virtual' });
      validated.logos.unshift({ type: 'logo', url: `artwork://${type}/${id}/logo`, provider: 'virtual' });
    }
    return validated;
  }

  private static validateImages(images?: Image[]): Image[] {
    if (!Array.isArray(images)) return [];
    const validImages: Image[] = [];
    for (const img of images) {
      try {
        validImages.push(this.validateImage(img));
      } catch (e) {}
    }
    return validImages;
  }

  private static validateVideos(videos?: Video[]): Video[] {
    if (!Array.isArray(videos)) return [];
    return videos.filter(v => v && v.type && v.url && v.site).map(v => ({
      type: v.type,
      url: String(v.url),
      site: String(v.site),
      language: v.language,
      resolution: v.resolution
    }));
  }

  private static validateExternalIds(ids?: Partial<ExternalIds>): ExternalIds {
    if (!ids) return {};
    return {
      tmdbId: ids.tmdbId ? String(ids.tmdbId) : undefined,
      tvdbId: ids.tvdbId ? String(ids.tvdbId) : undefined,
      imdbId: ids.imdbId ? String(ids.imdbId) : undefined,
      anilistId: ids.anilistId ? String(ids.anilistId) : undefined,
      anidbId: ids.anidbId ? String(ids.anidbId) : undefined,
      malId: ids.malId ? String(ids.malId) : undefined,
      traktId: ids.traktId ? String(ids.traktId) : undefined,
      tvmazeId: ids.tvmazeId ? String(ids.tvmazeId) : undefined,
    };
  }

  private static validateRatings(ratings?: Rating[]): Rating[] {
    if (!Array.isArray(ratings)) return [];
    return ratings.filter(r => r && r.provider && typeof r.score === 'number').map(r => ({
      provider: String(r.provider),
      score: r.score,
      votes: this.validatePositiveInteger(r.votes)
    }));
  }

  private static validateCredits(credits?: Credits): Credits | undefined {
    if (!credits) return undefined;
    return {
      cast: Array.isArray(credits.cast) ? credits.cast.map(p => { 
         try { return this.validatePerson(p); } catch { return null; }
      }).filter(Boolean) as Person[] : [],
      crew: Array.isArray(credits.crew) ? credits.crew.map(p => { 
         try { return this.validatePerson(p); } catch { return null; }
      }).filter(Boolean) as Person[] : [],
    };
  }

  private static validateStudios(studios?: Studio[]): Studio[] {
    if (!Array.isArray(studios)) return [];
    return studios.filter(s => s && s.id && s.name).map(s => ({
      id: String(s.id),
      name: String(s.name).trim(),
      logo: s.logo ? String(s.logo) : undefined,
    }));
  }

  private static validateNetworks(networks?: Network[]): Network[] {
    if (!Array.isArray(networks)) return [];
    return networks.filter(n => n && n.id && n.name).map(n => ({
      id: String(n.id),
      name: String(n.name).trim(),
      country: n.country ? String(n.country) : undefined,
    }));
  }

  private static validateCertifications(certifications?: Certification[]): Certification[] {
    if (!Array.isArray(certifications)) return [];
    return certifications.filter(c => c && c.rating && c.country).map(c => ({
      rating: String(c.rating),
      country: String(c.country),
      meaning: c.meaning ? String(c.meaning) : undefined,
    }));
  }

  private static validateCharacters(characters?: Character[]): Character[] {
    if (!Array.isArray(characters)) return [];
    return characters.map(c => {
      try { return this.validateCharacter(c); } catch { return null; }
    }).filter(Boolean) as Character[];
  }

  private static validateRelations(relations?: Relation[]): Relation[] {
    if (!Array.isArray(relations)) return [];
    return relations.filter(r => r && r.id && r.type && r.mediaType && r.title).map(r => ({
      id: String(r.id),
      type: String(r.type),
      mediaType: r.mediaType as any,
      title: String(r.title).trim()
    }));
  }
}

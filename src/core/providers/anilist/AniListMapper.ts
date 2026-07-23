import { Anime, ExternalIds, Genre, Image, ArtworkSet, Rating, Studio, Character, Person, Relation } from '../../models/DomainModels';

export class AniListMapper {
  
  private static mapFormat(format: string): 'tv' | 'movie' | 'ova' | 'ona' | 'special' | 'music' | 'short' {
    switch (format) {
      case 'TV': return 'tv';
      case 'TV_SHORT': return 'short';
      case 'MOVIE': return 'movie';
      case 'SPECIAL': return 'special';
      case 'OVA': return 'ova';
      case 'ONA': return 'ona';
      case 'MUSIC': return 'music';
      default: return 'tv';
    }
  }

  private static mapArtwork(data: any): ArtworkSet {
    const posters: Image[] = [];
    if (data.coverImage?.extraLarge) posters.push({ url: data.coverImage.extraLarge, type: 'poster' });
    else if (data.coverImage?.large) posters.push({ url: data.coverImage.large, type: 'poster' });
    
    const backdrops: Image[] = [];
    if (data.bannerImage) backdrops.push({ url: data.bannerImage, type: 'backdrop' });
    
    return {
      posters,
      backdrops,
      banners: backdrops,
      landscapes: [],
      thumbs: [],
      logos: [],
      clearLogos: [],
      clearArts: [],
      discArts: [],
      characterArts: []
    };
  }

  public static mapAnime(data: any): Anime {
    const characters: Character[] = (data.characters?.edges || []).map((edge: any) => {
      const voiceActors: Person[] = (edge.voiceActors || []).map((va: any) => ({
        id: `al_va_${va.id}`,
        name: va.name?.full || '',
        role: 'Voice Actor',
        profileImage: va.image?.large
      }));
      
      return {
        id: `al_char_${edge.node.id}`,
        name: edge.node.name?.full || '',
        role: edge.role || 'Unknown',
        characterImage: edge.node.image?.large,
        voiceActors
      };
    });

    const studios: Studio[] = (data.studios?.nodes || []).map((n: any) => ({
      id: `al_studio_${n.id}`,
      name: n.name
    }));

    const relations: Relation[] = (data.relations?.edges || []).map((edge: any) => ({
      id: `al_${edge.node.id}`,
      type: edge.relationType,
      mediaType: edge.node.type === 'ANIME' ? 'anime' : 'series', // basic mapping
      title: edge.node.title?.romaji || ''
    }));

    const genres: Genre[] = (data.genres || []).map((g: string) => ({ id: g, name: g }));
    const tags: string[] = (data.tags || []).map((t: any) => t.name);

    const ext: ExternalIds = { anilistId: String(data.id) };
    if (data.idMal) ext.malId = String(data.idMal);

    const ratings: Rating[] = [];
    if (data.averageScore) {
      ratings.push({ provider: 'AniList', score: data.averageScore });
    }

    return {
      id: `anilist_${data.id}`,
      type: this.mapFormat(data.format),
      romajiTitle: data.title?.romaji || '',
      englishTitle: data.title?.english || undefined,
      nativeTitle: data.title?.native || undefined,
      overview: data.description || '',
      season: data.season || undefined,
      seasonYear: data.seasonYear || undefined,
      episodes: data.episodes || undefined,
      status: data.status || 'Unknown',
      sourceMaterial: data.source || undefined,
      studios,
      characters,
      relations,
      popularity: data.popularity || undefined,
      averageScore: data.averageScore || undefined,
      tags,
      genres,
      ageRating: undefined, // Requires more complex query or mapping
      isAdult: data.isAdult || false,
      openingThemes: [], // Often needs separate API or advanced AniList query
      endingThemes: [],
      artwork: this.mapArtwork(data),
      externalIds: ext,
      ratings
    };
  }
}

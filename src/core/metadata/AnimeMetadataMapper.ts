import { Anime } from '../models/DomainModels';

export class AnimeMetadataMapper {
  // Converts provider-specific anime models to Canonical Anime Model
  public mapAniListToAnime(data: any): Partial<Anime> {
    return {
      id: data.id,
      romajiTitle: data.title?.romaji,
      englishTitle: data.title?.english,
      nativeTitle: data.title?.native,
      overview: data.description,
      status: data.status,
      // mapping logic placeholder
    };
  }
}

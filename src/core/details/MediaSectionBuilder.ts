import { MediaDetails, MediaSection } from './types';
import { Movie, Series, Anime } from '../models/DomainModels';

export class MediaSectionBuilder {
  public buildSections(details: MediaDetails): MediaSection[] {
    const sections: MediaSection[] = [];
    let order = 0;

    const addSection = (type: MediaSection['type'], title: string, data: any) => {
      if (data && (Array.isArray(data) ? data.length > 0 : true)) {
        sections.push({ id: `${type}_${order}`, type, title, data, order: order++ });
      }
    };

    const media = details.data;

    // Overview section (always first)
    addSection('overview', 'Overview', {
      overview: media.overview,
      genres: media.genres,
      duration: (media as any).durationMinutes,
      status: (media as any).status,
      releaseDate: (media as any).releaseDate || (media as any).firstAirDate,
      certifications: (media as any).certifications,
    });

    if (details.type === 'series' && details.activeEpisodes) {
      addSection('episodes', 'Episodes', {
        activeSeason: details.activeSeason,
        episodes: details.activeEpisodes,
      });
    }

    if ((media as any).credits?.cast?.length) {
      addSection('cast', 'Cast', (media as any).credits.cast);
    }
    
    if ((media as any).credits?.crew?.length) {
      addSection('metadata', 'Crew', (media as any).credits.crew);
    }

    if ((media as any).characters?.length) {
      addSection('characters', 'Characters', (media as any).characters);
    }

    if ((media as any).collection) {
      addSection('collections', 'Collection', (media as any).collection);
    }

    if ((media as any).studios?.length) {
      addSection('studios', 'Studios', (media as any).studios);
    }

    if ((media as any).videos?.length) {
      addSection('trailers', 'Trailers & Videos', (media as any).videos);
    }

    if (details.related?.length) {
      addSection('related', 'More Like This', details.related);
    }

    return sections;
  }
}

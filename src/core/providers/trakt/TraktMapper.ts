import { MediaReference, ExternalIds } from '../../models/DomainModels';

export class TraktMapper {
  public static mapMediaReference(item: any, type: 'movie' | 'series'): MediaReference {
    // Trending returns { watchers, movie: {...} } or { watchers, show: {...} }
    // Popular returns just the movie/show object
    const media = item.movie || item.show || item;
    
    const ext: ExternalIds = {};
    if (media.ids?.tmdb) ext.tmdbId = String(media.ids.tmdb);
    if (media.ids?.tvdb) ext.tvdbId = String(media.ids.tvdb);
    if (media.ids?.imdb) ext.imdbId = media.ids.imdb;
    if (media.ids?.trakt) ext.traktId = String(media.ids.trakt);

    return {
      id: `trakt_${media.ids?.trakt}`,
      type,
      title: media.title,
      year: media.year,
      externalIds: ext
    };
  }
}

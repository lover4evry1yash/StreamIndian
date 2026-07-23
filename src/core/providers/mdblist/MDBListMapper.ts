import { MediaReference, ExternalIds } from '../../models/DomainModels';

export class MDBListMapper {
  public static mapMediaReference(item: any): MediaReference {
    const ext: ExternalIds = {};
    if (item.tmdbid) ext.tmdbId = String(item.tmdbid);
    if (item.tvdbid) ext.tvdbId = String(item.tvdbid);
    if (item.imdbid) ext.imdbId = item.imdbid;
    if (item.traktid) ext.traktId = String(item.traktid);

    return {
      id: `mdblist_${item.id || item.tmdbid}`,
      type: item.mediatype === 'show' ? 'series' : 'movie',
      title: item.title,
      year: item.year,
      externalIds: ext
    };
  }
}

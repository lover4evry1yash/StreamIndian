import Dexie, { Table } from 'dexie';
import { IptvPlaylist, IptvChannel, IptvProgram } from './models';

export class IptvDatabase extends Dexie {
  playlists!: Table<IptvPlaylist, string>;
  channels!: Table<IptvChannel, string>;
  programs!: Table<IptvProgram, string>;

  constructor() {
    super('StreamIndianIptvDB');
    
    this.version(1).stores({
      playlists: 'id, name, type, autoUpdate',
      channels: 'id, playlistId, group, tvgId, streamId, isFavorite, [playlistId+group]',
      programs: 'id, playlistId, tvgId, startTime, endTime, [tvgId+startTime]'
    });
  }
}

export const iptvDb = new IptvDatabase();

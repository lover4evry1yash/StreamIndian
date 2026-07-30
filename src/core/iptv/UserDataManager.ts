import { iptvDb } from './IptvDatabase';
import { IptvChannel } from './models';

export class UserDataManager {
  public async toggleFavorite(channelId: string, isFavorite: boolean): Promise<void> {
    await iptvDb.channels.update(channelId, { isFavorite });
  }

  public async toggleHidden(channelId: string, isHidden: boolean): Promise<void> {
    await iptvDb.channels.update(channelId, { isHidden });
  }

  public async getFavorites(): Promise<IptvChannel[]> {
    return iptvDb.channels.filter(c => c.isFavorite).toArray(); // using filter instead of where because isFavorite might not be indexed perfectly or boolean indexing in older Dexie might fail
  }

  public async addRecentlyWatched(channel: IptvChannel): Promise<void> {
    try {
      const stored = localStorage.getItem('iptv_recent_channels');
      let recents: IptvChannel[] = stored ? JSON.parse(stored) : [];
      
      recents = recents.filter(c => c.id !== channel.id);
      recents.unshift(channel);
      
      if (recents.length > 50) recents = recents.slice(0, 50);
      
      localStorage.setItem('iptv_recent_channels', JSON.stringify(recents));
    } catch (e) {
      console.error('Failed to save recently watched channel', e);
    }
  }

  public async getRecentlyWatched(): Promise<IptvChannel[]> {
    try {
      const stored = localStorage.getItem('iptv_recent_channels');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
}

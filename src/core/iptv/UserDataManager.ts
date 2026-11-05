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
    return iptvDb.channels.toCollection()
      .filter((channel) => channel.isFavorite && !channel.isHidden)
      .limit(500)
      .toArray();
  }

  public async getFavoritesByPlaylist(playlistId: string, limit = 200): Promise<IptvChannel[]> {
    const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
    return iptvDb.channels.where('playlistId').equals(playlistId)
      .filter((channel) => channel.isFavorite && !channel.isHidden)
      .limit(safeLimit)
      .toArray();
  }

  public async addRecentlyWatched(channel: IptvChannel): Promise<void> {
    try {
      const stored = localStorage.getItem('iptv_recent_channels');
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      let recents: IptvChannel[] = Array.isArray(parsed) ? parsed.filter(isChannelRecord) : [];
      
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
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.filter(isChannelRecord).slice(0, 50) : [];
    } catch (e) {
      return [];
    }
  }
}

function isChannelRecord(value: unknown): value is IptvChannel {
  if (!value || typeof value !== 'object') return false;
  const channel = value as Partial<IptvChannel>;
  return typeof channel.id === 'string' && typeof channel.name === 'string'
    && typeof channel.streamUrl === 'string' && typeof channel.playlistId === 'string';
}

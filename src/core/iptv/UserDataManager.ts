import { iptvDb } from './IptvDatabase';
import { IptvChannel } from './models';

export class UserDataManager {
  private static readonly RECENT_KEY = 'iptv_recent_channels';
  private static readonly MAX_RECENT = 50;

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
      const stored = localStorage.getItem(UserDataManager.RECENT_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      const recents = Array.isArray(parsed) ? parsed.filter(isChannelReference) : [];
      const next = recents.filter((entry) => entry.id !== channel.id || entry.playlistId !== channel.playlistId);
      next.unshift({ id: channel.id, playlistId: channel.playlistId });
      localStorage.setItem(UserDataManager.RECENT_KEY, JSON.stringify(next.slice(0, UserDataManager.MAX_RECENT)));
    } catch {
      // Recent history is optional; playback should continue when storage is unavailable.
    }
  }

  public async getRecentlyWatched(): Promise<IptvChannel[]> {
    try {
      const stored = localStorage.getItem(UserDataManager.RECENT_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) return [];

      const references = parsed.filter(isChannelReference).slice(0, UserDataManager.MAX_RECENT);
      const records = await iptvDb.channels.bulkGet(references.map((entry) => entry.id));
      const playlistById = new Map(references.map((entry) => [entry.id, entry.playlistId]));
      const channels = records.filter((channel): channel is IptvChannel => !!channel
        && playlistById.get(channel.id) === channel.playlistId && !channel.isHidden);
      // This also migrates older entries by rewriting history without embedded stream URLs.
      localStorage.setItem(UserDataManager.RECENT_KEY, JSON.stringify(channels.map(({ id, playlistId }) => ({ id, playlistId }))));
      return channels;
    } catch {
      return [];
    }
  }
}

function isChannelReference(value: unknown): value is { id: string; playlistId: string } {
  if (!value || typeof value !== 'object') return false;
  const channel = value as { id?: unknown; playlistId?: unknown };
  return typeof channel.id === 'string' && typeof channel.playlistId === 'string';
}

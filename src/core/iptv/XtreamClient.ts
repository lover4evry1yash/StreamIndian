import { NetworkClient } from '../NetworkClient';
import { IptvPlaylist, IptvChannel } from './models';
import { Logger } from '../Logger';

export class XtreamClient {
  constructor(private network: NetworkClient, private logger: Logger) {}

  public async authenticate(playlist: IptvPlaylist): Promise<boolean> {
    const url = this.buildPlayerApiUrl(playlist);
    if (!url) return false;
    try {
      const data = await this.network.getJson<any>(url);
      return data && data.user_info && data.user_info.auth === 1;
    } catch (e) {
      this.logger.error('Xtream authentication failed', e);
      return false;
    }
  }

  public async fetchCategories(playlist: IptvPlaylist, type: 'live' | 'vod' | 'series' = 'live'): Promise<any[]> {
    let action = 'get_live_categories';
    if (type === 'vod') action = 'get_vod_categories';
    else if (type === 'series') action = 'get_series_categories';

    const url = this.buildPlayerApiUrl(playlist, { action });
    if (!url) return [];
    try {
      const data = await this.network.getJson<any[]>(url);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      this.logger.error(`Xtream fetchCategories (${type}) failed`, e);
      return [];
    }
  }

  public async fetchLiveStreams(playlist: IptvPlaylist, categoryId?: string): Promise<IptvChannel[]> {
    const url = this.buildPlayerApiUrl(playlist, {
      action: 'get_live_streams',
      ...(categoryId ? { category_id: categoryId } : {}),
    });
    if (!url) return [];

    try {
      const data = await this.network.getJson<any[]>(url);
      if (!Array.isArray(data)) return [];

      return data.map(stream => ({
        id: `xtream_live_${playlist.id}_${stream.stream_id}`,
        playlistId: playlist.id,
        name: stream.name,
        streamUrl: `${playlist.url!.replace(/\/+$/, '')}/${encodeURIComponent(playlist.username!)}/${encodeURIComponent(playlist.password!)}/${encodeURIComponent(String(stream.stream_id))}`,
        logoUrl: stream.stream_icon,
        group: stream.category_id == null ? (categoryId || 'Uncategorized') : String(stream.category_id),
        tvgId: stream.epg_channel_id,
        streamId: stream.stream_id,
        isFavorite: false,
        isHidden: false,
        catchupDays: stream.tv_archive ? stream.tv_archive_duration : 0,
        catchupSource: stream.tv_archive ? 'xtream' : undefined
      }));
    } catch (e) {
      this.logger.error('Xtream fetchLiveStreams failed', e);
      return [];
    }
  }

  public async fetchVodStreams(playlist: IptvPlaylist, categoryId?: string): Promise<any[]> {
    const url = this.buildPlayerApiUrl(playlist, {
      action: 'get_vod_streams',
      ...(categoryId ? { category_id: categoryId } : {}),
    });
    if (!url) return [];

    try {
      const data = await this.network.getJson<any[]>(url);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      this.logger.error('Xtream fetchVodStreams failed', e);
      return [];
    }
  }

  public async fetchSeries(playlist: IptvPlaylist, categoryId?: string): Promise<any[]> {
    const url = this.buildPlayerApiUrl(playlist, {
      action: 'get_series',
      ...(categoryId ? { category_id: categoryId } : {}),
    });
    if (!url) return [];

    try {
      const data = await this.network.getJson<any[]>(url);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      this.logger.error('Xtream fetchSeries failed', e);
      return [];
    }
  }

  private buildPlayerApiUrl(playlist: IptvPlaylist, extra: Record<string, string> = {}): string | null {
    if (!playlist.url || !playlist.username || !playlist.password) return null;
    const baseUrl = playlist.url.replace(/\/+$/, '');
    const parameters = new URLSearchParams({
      username: playlist.username,
      password: playlist.password,
      ...extra,
    });
    return `${baseUrl}/player_api.php?${parameters.toString()}`;
  }
}

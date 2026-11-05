import { NetworkClient } from '../NetworkClient';
import { IptvPlaylist, IptvChannel } from './models';
import { Logger } from '../Logger';

export interface XtreamSeries {
  id: string;
  name: string;
  coverUrl?: string;
  categoryId?: string;
}

export interface XtreamEpisode extends IptvChannel {
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
}

const MAX_XTREAM_ITEMS = 5_000;
const MAX_XTREAM_RESPONSE_BYTES = 32 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['m3u8', 'mp4', 'mkv', 'avi', 'ts', 'mpg', 'mpeg', 'webm', 'mov']);

export class XtreamClient {
  constructor(private network: NetworkClient, private logger: Logger) {}

  public async authenticate(playlist: IptvPlaylist): Promise<boolean> {
    const url = this.buildPlayerApiUrl(playlist);
    if (!url) return false;
    try {
      const data = await this.network.getJson<any>(url, { maxResponseBytes: MAX_XTREAM_RESPONSE_BYTES });
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
      const data: unknown = await this.network.getJson<unknown>(url, { maxResponseBytes: MAX_XTREAM_RESPONSE_BYTES });
      return Array.isArray(data) ? data.slice(0, MAX_XTREAM_ITEMS) : [];
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
      const data: unknown = await this.network.getJson<unknown>(url, { maxResponseBytes: MAX_XTREAM_RESPONSE_BYTES });
      if (!Array.isArray(data)) return [];
      return data.slice(0, MAX_XTREAM_ITEMS).flatMap((entry): IptvChannel[] => {
        if (!isRecord(entry)) return [];
        const streamId = numericId(entry.stream_id);
        const name = boundedString(entry.name, 200);
        if (!streamId || !name) return [];
        const extension = entry.container_extension == null || entry.container_extension === ''
          ? 'ts' : safeExtension(entry.container_extension);
        if (!extension) return [];
        return [this.makeChannel(playlist, `live:${streamId}`, name,
          `/live/${encodeURIComponent(streamId)}.${extension}`, {
          contentType: 'live',
          logoUrl: validHttpUrl(entry.stream_icon),
          group: boundedString(entry.category_id, 100) ?? categoryId ?? 'Uncategorized',
          tvgId: boundedString(entry.epg_channel_id, 200),
          streamId: Number(streamId),
          catchupDays: entry.tv_archive === 1 || entry.tv_archive === '1'
            ? Math.max(0, Math.min(365, Number(entry.tv_archive_duration) || 0)) : 0,
          catchupSource: entry.tv_archive === 1 || entry.tv_archive === '1' ? 'xtream' : undefined,
        })];
      });
    } catch (e) {
      this.logger.error('Xtream fetchLiveStreams failed', e);
      return [];
    }
  }

  public async fetchVodStreams(playlist: IptvPlaylist, categoryId?: string): Promise<IptvChannel[]> {
    const url = this.buildPlayerApiUrl(playlist, {
      action: 'get_vod_streams',
      ...(categoryId ? { category_id: categoryId } : {}),
    });
    if (!url) return [];

    try {
      const data: unknown = await this.network.getJson<unknown>(url, { maxResponseBytes: MAX_XTREAM_RESPONSE_BYTES });
      if (!Array.isArray(data)) return [];
      return data.slice(0, MAX_XTREAM_ITEMS).flatMap((entry): IptvChannel[] => {
        if (!isRecord(entry)) return [];
        const streamId = numericId(entry.stream_id);
        const name = boundedString(entry.name, 200);
        const extension = safeExtension(entry.container_extension);
        if (!streamId || !name || !extension) return [];
        return [this.makeChannel(playlist, `vod:${streamId}`, name,
          `/movie/${encodeURIComponent(streamId)}.${extension}`, {
            contentType: 'vod',
            logoUrl: validHttpUrl(entry.stream_icon),
            group: boundedString(entry.category_id, 100) ?? categoryId ?? 'Movies',
          })];
      });
    } catch (e) {
      this.logger.error('Xtream fetchVodStreams failed', e);
      return [];
    }
  }

  public async fetchSeries(playlist: IptvPlaylist, categoryId?: string): Promise<XtreamSeries[]> {
    const url = this.buildPlayerApiUrl(playlist, {
      action: 'get_series',
      ...(categoryId ? { category_id: categoryId } : {}),
    });
    if (!url) return [];

    try {
      const data: unknown = await this.network.getJson<unknown>(url, { maxResponseBytes: MAX_XTREAM_RESPONSE_BYTES });
      if (!Array.isArray(data)) return [];
      return data.slice(0, MAX_XTREAM_ITEMS).flatMap((entry): XtreamSeries[] => {
        if (!isRecord(entry)) return [];
        const id = numericId(entry.series_id);
        const name = boundedString(entry.name, 200);
        if (!id || !name) return [];
        return [{ id, name, coverUrl: validHttpUrl(entry.cover), categoryId: boundedString(entry.category_id, 100) }];
      });
    } catch (e) {
      this.logger.error('Xtream fetchSeries failed', e);
      return [];
    }
  }

  public async fetchSeriesEpisodes(playlist: IptvPlaylist, seriesId: string): Promise<XtreamEpisode[]> {
    const id = numericId(seriesId);
    const url = id ? this.buildPlayerApiUrl(playlist, { action: 'get_series_info', series_id: id }) : null;
    if (!url) return [];
    try {
      const data: unknown = await this.network.getJson<unknown>(url, { maxResponseBytes: MAX_XTREAM_RESPONSE_BYTES });
      if (!isRecord(data) || !isRecord(data.episodes)) return [];
      const episodes: XtreamEpisode[] = [];
      for (const [seasonKey, seasonEpisodes] of Object.entries(data.episodes)) {
        const parsedSeasonNumber = Number(seasonKey);
        if (!Number.isInteger(parsedSeasonNumber) || parsedSeasonNumber < 0 || !Array.isArray(seasonEpisodes)) continue;
        const seasonNumber = Math.max(1, parsedSeasonNumber);
        for (const entry of seasonEpisodes.slice(0, MAX_XTREAM_ITEMS - episodes.length)) {
          if (!isRecord(entry)) continue;
          const episodeId = numericId(entry.id);
          const name = boundedString(entry.title, 200) ?? boundedString(entry.name, 200);
          const extension = safeExtension(entry.container_extension);
          const episodeNumber = Number(entry.episode_num);
          if (!episodeId || !name || !extension || !Number.isInteger(episodeNumber) || episodeNumber < 0) continue;
          episodes.push({
            ...this.makeChannel(playlist, `series:${id}:${episodeId}`, name,
              `/series/${encodeURIComponent(episodeId)}.${extension}`, {
                contentType: 'episode',
                logoUrl: isRecord(entry.info) ? validHttpUrl(entry.info.movie_image) : undefined,
                group: `Season ${seasonNumber}`,
              }),
            seriesId: id,
            seasonNumber,
            episodeNumber,
          });
        }
        if (episodes.length >= MAX_XTREAM_ITEMS) break;
      }
      return episodes;
    } catch (error) {
      this.logger.error('Xtream fetchSeriesEpisodes failed', error);
      return [];
    }
  }

  private makeChannel(
    playlist: IptvPlaylist,
    itemId: string,
    name: string,
    path: string,
    metadata: Partial<IptvChannel>,
  ): IptvChannel {
    const base = new URL(playlist.url!);
    const username = encodeURIComponent(playlist.username!);
    const password = encodeURIComponent(playlist.password!);
    return {
      id: `xtream_${playlist.id}_${itemId}`,
      playlistId: playlist.id,
      name,
      streamUrl: `${base.origin}${base.pathname.replace(/\/+$/, '')}/${username}/${password}${path}`,
      group: metadata.group ?? 'Uncategorized',
      isFavorite: false,
      isHidden: false,
      ...metadata,
    };
  }

  private buildPlayerApiUrl(playlist: IptvPlaylist, extra: Record<string, string> = {}): string | null {
    if (!playlist.url || !playlist.username || !playlist.password) return null;
    let baseUrl: string;
    try {
      const parsed = new URL(playlist.url);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return null;
      baseUrl = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
    } catch {
      return null;
    }
    const parameters = new URLSearchParams({
      username: playlist.username,
      password: playlist.password,
      ...extra,
    });
    return `${baseUrl}/player_api.php?${parameters.toString()}`;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function numericId(value: unknown): string | null {
  const id = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : '';
  return /^\d{1,20}$/.test(id) ? id : null;
}

function boundedString(value: unknown, maxLength: number): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim().slice(0, maxLength) : undefined;
}

function validHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? value.slice(0, 2048) : undefined;
  } catch {
    return undefined;
  }
}

function safeExtension(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const extension = value.trim().toLowerCase().replace(/^\./, '');
  return ALLOWED_EXTENSIONS.has(extension) ? extension : null;
}
